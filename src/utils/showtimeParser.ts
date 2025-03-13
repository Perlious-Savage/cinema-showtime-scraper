
export interface Showtime {
  place: string;
  showtime: string;
  bookingLink: string;
  screenType?: string;
}

export function extractShowtimes(markdown: string): Showtime[] {
  const showtimesData: Showtime[] = [];
  
  // Debug the markdown content
  console.log("Processing markdown content, length:", markdown?.length || 0);
  console.log("First 500 chars:", markdown?.substring(0, 500));
  
  // First try the novocinemas pattern
  try {
    // Pattern to find cinema locations from Novo Cinemas
    const novoLocations = Array.from(markdown.matchAll(/\[(.*?)\\\\/g))
      .map(match => ({
        place: match[1].trim(),
        index: match.index
      }))
      .sort((a, b) => a.index! - b.index!);
    
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
  
  // If Novo pattern fails or doesn't match, try the standard pattern
  try {
    console.log("Trying standard pattern...");
    
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
  } catch (e) {
    console.error("Error in standard pattern parsing:", e);
  }
  
  // If still empty, try one more fallback pattern for structured text format
  if (showtimesData.length === 0) {
    try {
      console.log("Trying manual text pattern as fallback...");
      
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
    } catch (e) {
      console.error("Error in fallback text pattern parsing:", e);
    }
  }
  
  console.log(`Total showtimes extracted: ${showtimesData.length}`);
  return showtimesData;
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
