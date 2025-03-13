
export interface Showtime {
  place: string;
  showtime: string;
  bookingLink: string;
  screenType?: string;
}

// Extract showtimes from Cine Royal format
export function extractCineRoyalShowtimes(markdown: string): Showtime[] {
  const showtimesData: Showtime[] = [];
  
  try {
    console.log("Trying Cine Royal pattern...");
    
    // Extract booking link first
    const bookingLinkRegex = /\[VIEW SHOWTIMES\]\((https:\/\/cineroyal\.ae\/home\/chooseScreen\/.*?#showTimeContainer)\)/;
    const bookingLinkMatch = markdown.match(bookingLinkRegex);
    const bookingLink = bookingLinkMatch ? bookingLinkMatch[1] : "#";
    
    // Pattern to find cinema locations and their showtimes
    const placeRegex = /(Khalidiyah Mall|Dalma Mall|Al Dhannah Mall|Deerfields Mall)[\s\S]*?STANDARD[\s\S]*?((?:\d{1,2}:\d{2}[AP]MAvailable: \d+[\s\S]*?)+)/g;
    let match;
    
    while ((match = placeRegex.exec(markdown)) !== null) {
      const place = match[1].trim();
      const showtimesBlock = match[2].trim();
      
      console.log(`Found Cine Royal location: ${place}`);
      
      // Extract individual showtimes
      const showtimeLines = showtimesBlock.split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/\d{1,2}:\d{2}[AP]MAvailable:/));
      
      for (const line of showtimeLines) {
        // Extract just the time part (e.g., "12:30PM" from "12:30PMAvailable: 123")
        const timeMatch = line.match(/(\d{1,2}:\d{2}[AP]M)/);
        if (timeMatch) {
          const showtime = timeMatch[1];
          
          console.log(`Found Cine Royal showtime: ${showtime} at ${place}`);
          
          showtimesData.push({
            place,
            showtime,
            bookingLink,
            screenType: "STANDARD"
          });
        }
      }
    }
    
    if (showtimesData.length > 0) {
      console.log(`Extracted ${showtimesData.length} Cine Royal showtimes`);
      return showtimesData;
    }
  } catch (e) {
    console.error("Error in Cine Royal pattern parsing:", e);
  }
  
  return showtimesData;
}

export function extractShowtimes(markdown: string): Showtime[] {
  // Debug the markdown content
  console.log("Processing markdown content, length:", markdown?.length || 0);
  console.log("First 500 chars:", markdown?.substring(0, 500));
  
  // Try Cine Royal pattern first
  const cineRoyalShowtimes = extractCineRoyalShowtimes(markdown);
  if (cineRoyalShowtimes.length > 0) {
    return cineRoyalShowtimes;
  }
  
  // If Cine Royal pattern fails, try the Novo pattern
  try {
    // Pattern to find cinema locations from Novo Cinemas
    const novoLocations = Array.from(markdown.matchAll(/\[(.*?)\\\\/g))
      .map(match => ({
        place: match[1].trim(),
        index: match.index
      }))
      .sort((a, b) => a.index! - b.index!);
    
    const showtimesData: Showtime[] = [];
    
    if (novoLocations.length > 0) {
      console.log(`Found ${novoLocations.length} Novo cinema locations`);
      
      // Process each location and extract showtimes
      for (let i = 0; i < novoLocations.length; i++) {
        const currentLocation = novoLocations[i];
        // Determine the end index (either the next location or the end of the string)
        const endIndex = i < novoLocations.length - 1 
          ? novoLocations[i+1].index 
          : markdown.length;
        
        // Extract the content block for this location
        const locationContent = markdown.substring(currentLocation.index!, endIndex);
        console.log(`Processing location: ${currentLocation.place}, content length: ${locationContent.length}`);
        
        // Find the language line if available (e.g., "English")
        const languageLine = locationContent.match(/^\s*([A-Za-z]+)\s*$/m);
        let language = languageLine ? languageLine[1].trim() : null;
        
        // Extract all showtimes within this location block
        const showtimeMatches = Array.from(locationContent.matchAll(/- \[(.*?)\]\((https:\/\/.*?)\)(?:\s+([^-\n]+))?/g));
        
        for (const showtimeMatch of showtimeMatches) {
          const showtime = showtimeMatch[1].trim();
          const bookingLink = showtimeMatch[2].trim();
          // Check if there's a screen type after the link (e.g. "2D" or "2D/7STAR")
          const screenTypeText = showtimeMatch[3]?.trim() || "";
          const screenType = screenTypeText || "Standard";
          
          console.log(`Found showtime for ${currentLocation.place}: ${showtime}, type: ${screenType}`);
          
          showtimesData.push({
            place: currentLocation.place,
            showtime: showtime,
            bookingLink: bookingLink,
            screenType: screenType
          });
        }
      }
      
      if (showtimesData.length > 0) {
        console.log(`Extracted ${showtimesData.length} showtimes using Novo pattern`);
        return showtimesData;
      }
    }
  } catch (e) {
    console.error("Error in Novo pattern parsing:", e);
  }
  
  // If previous patterns fail, try the standard pattern
  try {
    console.log("Trying standard pattern...");
    const showtimesData: Showtime[] = [];
    
    // Pattern to find cinema locations with their showtimes blocks
    const placePattern = /### ([^#\n]+)[\s\n]+([\s\S]*?)(?=\n\n### |\n\n\*\*|\n\*\*\*|\Z)/g;
    let placeMatch;
    
    while ((placeMatch = placePattern.exec(markdown)) !== null) {
      const place = placeMatch[1].trim();
      const showtimesBlock = placeMatch[2];
      
      console.log(`Found standard cinema location: ${place}`);
      console.log(`Showtimes block length: ${showtimesBlock.length}`);
      
      // Pattern to find showtime links
      const showtimePattern = /\[([\d:]+(?:am|pm)?)\]\((https:\/\/.*?)\)/gi;
      
      // Pattern to find screen types
      const screenBlocks = showtimesBlock.split(/\d+\.\s+\*\*/);
      
      if (screenBlocks.length > 1) {
        // Process each screen type separately
        for (let i = 1; i < screenBlocks.length; i++) {
          const screenBlock = screenBlocks[i];
          const screenTypeMatch = /^(.*?)\*\*/.exec(screenBlock);
          
          if (!screenTypeMatch) continue;
          
          const screenType = screenTypeMatch[1].trim();
          console.log(`Found screen type: ${screenType}`);
          
          // Reset regex lastIndex
          showtimePattern.lastIndex = 0;
          
          let showtimeMatch;
          while ((showtimeMatch = showtimePattern.exec(screenBlock)) !== null) {
            const showtime = showtimeMatch[1].trim();
            const bookingLink = showtimeMatch[2].trim();
            
            console.log(`Found standard showtime: ${showtime}, booking link: ${bookingLink}`);
            
            showtimesData.push({
              place,
              showtime,
              bookingLink,
              screenType
            });
          }
        }
      } else {
        // If no screen types found, process the whole block with "Standard" type
        let showtimeMatch;
        showtimePattern.lastIndex = 0;
        while ((showtimeMatch = showtimePattern.exec(showtimesBlock)) !== null) {
          const showtime = showtimeMatch[1].trim();
          const bookingLink = showtimeMatch[2].trim();
          
          console.log(`Found showtime with no screen type: ${showtime}`);
          
          showtimesData.push({
            place,
            showtime,
            bookingLink,
            screenType: "Standard"
          });
        }
      }
    }
    
    if (showtimesData.length > 0) {
      return showtimesData;
    }
  } catch (e) {
    console.error("Error in standard pattern parsing:", e);
  }
  
  // If still empty, try one more fallback pattern for structured text format
  try {
    console.log("Trying manual text pattern as fallback...");
    const showtimesData: Showtime[] = [];
    
    // This pattern assumes a format like the example given by the user
    // Where each location is followed by showtimes and screen types
    const locations = markdown.split(/\n(?=[A-Za-z]+ [A-Za-z]+ -)/);
    
    for (const locationBlock of locations) {
      // Skip empty blocks
      if (!locationBlock.trim()) continue;
      
      const lines = locationBlock.split('\n').filter(line => line.trim());
      if (lines.length < 3) continue; // Need at least location, language, and a showtime
      
      // First line should be the location
      const place = lines[0].trim();
      // Second line should be the language
      const language = lines[1].trim();
      
      console.log(`Processing location from text: ${place}, language: ${language}`);
      
      // Process pairs of lines (time and screen type)
      for (let i = 2; i < lines.length; i += 2) {
        if (i + 1 >= lines.length) break;
        
        const showtime = lines[i].trim();
        const screenType = lines[i + 1].trim();
        
        // Use a dummy booking link since we don't have one in this format
        const bookingLink = "#";
        
        console.log(`Found text-format showtime: ${showtime}, type: ${screenType}`);
        
        showtimesData.push({
          place,
          showtime,
          bookingLink,
          screenType
        });
      }
    }
    
    if (showtimesData.length > 0) {
      return showtimesData;
    }
  } catch (e) {
    console.error("Error in fallback text pattern parsing:", e);
  }
  
  console.log(`No showtimes extracted from any pattern`);
  return [];
}

// Group showtimes by location and screen type for better display
export function groupShowtimes(showtimes: Showtime[]): Record<string, Record<string, Showtime[]>> {
  const grouped: Record<string, Record<string, Showtime[]>> = {};
  
  showtimes.forEach(showtime => {
    // Create place if it doesn't exist
    if (!grouped[showtime.place]) {
      grouped[showtime.place] = {};
    }
    
    const screenType = showtime.screenType || "Standard";
    
    // Create screen type if it doesn't exist
    if (!grouped[showtime.place][screenType]) {
      grouped[showtime.place][screenType] = [];
    }
    
    // Add showtime to the appropriate group
    grouped[showtime.place][screenType].push(showtime);
  });
  
  return grouped;
}

// Helper function to parse raw text format
export function parseRawNovoText(text: string): Showtime[] {
  const showtimes: Showtime[] = [];
  
  try {
    // Split by empty lines to get location blocks
    const blocks = text.split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;
      
      // First line is the location
      const place = lines[0].trim();
      // Second line may be language
      const language = lines[1].match(/^[A-Za-z]+$/) ? lines[1].trim() : null;
      
      // Start from index 1 or 2 depending on if we have a language line
      const startIndex = language ? 2 : 1;
      
      // Process pairs of lines (time and type)
      for (let i = startIndex; i < lines.length; i += 2) {
        if (i + 1 >= lines.length) break;
        
        const showtime = lines[i].trim();
        const screenType = lines[i + 1].trim();
        
        // Skip if either is empty
        if (!showtime || !screenType) continue;
        
        showtimes.push({
          place,
          showtime,
          bookingLink: "#", // Placeholder
          screenType
        });
      }
    }
  } catch (e) {
    console.error("Error parsing raw Novo text:", e);
  }
  
  return showtimes;
}
