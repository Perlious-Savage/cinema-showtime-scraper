export interface Showtime {
  place: string;
  showtime: string;
  bookingLink: string;
  screenType?: string;
}

export function extractShowtimes(markdown: string): Showtime[] {
  const showtimesData: Showtime[] = [];
  
  // First try the novocinemas pattern
  const novoPlacePattern = /\[(.*?)\\\\/g;
  const novoShowtimePattern = /- \[(.*?)\]\((https:\/\/.*?)\)/g;
  
  let foundNovoShowtimes = false;
  let placeMatch;
  
  // Debug the markdown content
  console.log("Processing markdown content, length:", markdown?.length || 0);
  console.log("First 500 chars:", markdown?.substring(0, 500));
  
  // Try Novo Cinemas pattern first
  while ((placeMatch = novoPlacePattern.exec(markdown)) !== null) {
    foundNovoShowtimes = true;
    const place = placeMatch[1].trim();
    const showtimesBlock = markdown.substring(placeMatch.index);
    
    console.log(`Found Novo cinema location: ${place}`);
    
    let showtimeMatch;
    while ((showtimeMatch = novoShowtimePattern.exec(showtimesBlock)) !== null) {
      const showtime = showtimeMatch[1].trim();
      const bookingLink = showtimeMatch[2].trim();
      
      console.log(`Found Novo showtime: ${showtime}, booking link: ${bookingLink}`);
      
      showtimesData.push({
        place,
        showtime,
        bookingLink,
        screenType: "Standard" // Default for Novo since they don't specify
      });
    }
  }
  
  // If no Novo showtimes found, try the original pattern
  if (!foundNovoShowtimes) {
    // Pattern to find cinema locations with their showtimes blocks
    const placePattern = /### ([^#\n]+)[\s\n]+([\s\S]*?)(?=\n\n### |\n\n\*\*|\n\*\*\*|\Z)/g;
    const showtimePattern = /\[([\d:]+(?:am|pm)?)\]\((https:\/\/.*?)\)/gi;
    const screenTypePattern = /\d+\.\s+\*\*(.*?)\*\*/;
    
    while ((placeMatch = placePattern.exec(markdown)) !== null) {
      const place = placeMatch[1].trim();
      const showtimesBlock = placeMatch[2];
      
      console.log(`Found standard cinema location: ${place}`);
      console.log(`Showtimes block length: ${showtimesBlock.length}`);
      
      // Split the block by numbered screen types
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
