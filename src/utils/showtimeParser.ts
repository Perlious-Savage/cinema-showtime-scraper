
export interface Showtime {
  place: string;
  showtime: string;
  bookingLink: string;
  screenType?: string; // For IMAX, Standard, VIP, etc.
}

export function extractShowtimes(markdown: string): Showtime[] {
  const showtimesData: Showtime[] = [];
  
  // Pattern to find cinema locations with their showtimes blocks
  const placePattern = /### (.*?)\n\n([\s\S]*?)(?=\n\n### |\n\n\*|\Z)/g;
  
  // Pattern to find showtimes and their booking links
  const showtimePattern = /\[(.*?)\]\((https:\/\/.*?)\)/g;
  
  // Pattern to detect screen types (Standard, IMAX, etc.)
  const screenTypePattern = /\*\*(.*?)\*\*/g;
  
  let placeMatch;
  while ((placeMatch = placePattern.exec(markdown)) !== null) {
    const place = placeMatch[1].trim();
    const showtimesBlock = placeMatch[2];
    
    // Split the block by screen types
    const screenBlocks = showtimesBlock.split(/\d\.\s+\*\*/);
    
    if (screenBlocks.length > 1) {
      // Process each screen type separately
      for (let i = 1; i < screenBlocks.length; i++) {
        const screenBlock = screenBlocks[i];
        const screenTypeMatch = screenTypePattern.exec(screenBlock);
        
        if (!screenTypeMatch) continue;
        
        const screenType = screenTypeMatch[1].trim();
        
        // Reset the regex lastIndex to find all showtimes
        showtimePattern.lastIndex = 0;
        
        let showtimeMatch;
        while ((showtimeMatch = showtimePattern.exec(screenBlock)) !== null) {
          const showtime = showtimeMatch[1].trim();
          const bookingLink = showtimeMatch[2].trim();
          
          showtimesData.push({
            place,
            showtime,
            bookingLink,
            screenType
          });
        }
      }
    } else {
      // If no screen types found, process the whole block
      let showtimeMatch;
      while ((showtimeMatch = showtimePattern.exec(showtimesBlock)) !== null) {
        const showtime = showtimeMatch[1].trim();
        const bookingLink = showtimeMatch[2].trim();
        
        showtimesData.push({
          place,
          showtime,
          bookingLink,
          screenType: "Standard"
        });
      }
    }
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
