
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
  
  // First try the Reel Cinemas pattern
  try {
    const reelShowtimes = extractReelShowtimes(markdown);
    if (reelShowtimes.length > 0) {
      console.log(`Extracted ${reelShowtimes.length} Reel Cinema showtimes`);
      return reelShowtimes;
    }
  } catch (e) {
    console.error("Error in Reel Cinemas pattern parsing:", e);
  }
  
  // Then try the novocinemas pattern
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
  
  console.log(`Total showtimes extracted: ${showtimesData.length}`);
  return showtimesData;
}

// Function to extract Reel Cinemas showtimes
function extractReelShowtimes(markdown: string): Showtime[] {
  const showtimesData: Showtime[] = [];
  
  try {
    console.log("Trying Reel Cinemas pattern...");
    
    // Extract booking link base
    const bookingLinkRegex = /\[Book Now\]\((https:\/\/reelcinemas\.com\/en-ae\/movie-details\/.*?)(#)?\)/;
    const bookingLinkMatch = markdown.match(bookingLinkRegex);
    const bookingLinkBase = bookingLinkMatch ? bookingLinkMatch[1] : "#";
    
    // Pattern to find cinema locations and their experience types and showtimes
    const placeRegex = /(Dubai Mall|Dubai Marina Mall|The Springs Souk|[A-Za-z\s\-]+)[\s\S]*?(Reel Platinum Suites|Dolby Cinema|Reel Standard|[A-Za-z0-9\s\-\/]+)[\s\S]*?((?:\d{1,2}:\d{2} [AP]M[\s\S]*?)+)/g;
    
    let match;
    while ((match = placeRegex.exec(markdown)) !== null) {
      const place = match[1].trim();
      const screenType = match[2].trim();
      const showtimesText = match[3].trim();
      
      console.log(`Found Reel cinema location: ${place}, type: ${screenType}`);
      
      // Extract individual showtimes
      const showtimeMatches = showtimesText.split('\n')
        .map(time => time.trim())
        .filter(time => time && /\d{1,2}:\d{2} [AP]M/.test(time));
      
      for (const showtime of showtimeMatches) {
        console.log(`Found Reel showtime: ${showtime} for ${place}`);
        
        showtimesData.push({
          place,
          showtime,
          bookingLink: bookingLinkBase,
          screenType
        });
      }
    }
    
    console.log(`Extracted ${showtimesData.length} Reel Cinema showtimes`);
  } catch (e) {
    console.error("Error in Reel Cinemas pattern extraction:", e);
  }
  
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
