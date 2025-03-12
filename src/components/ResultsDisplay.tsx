
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Showtime } from '@/utils/showtimeParser';

interface ResultsDisplayProps {
  groupedShowtimes: Record<string, Record<string, Showtime[]>>;
  movieTitle: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ groupedShowtimes, movieTitle }) => {
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
  const [selectedScreenType, setSelectedScreenType] = useState<string | null>(null);
  
  // Get all unique screen types
  const allScreenTypes = Object.values(groupedShowtimes).flatMap(screenTypes => 
    Object.keys(screenTypes)
  ).filter((value, index, self) => self.indexOf(value) === index);
  
  // Toggle location expansion
  const toggleLocation = (location: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }));
  };
  
  // Filter by screen type
  const handleScreenTypeFilter = (type: string | null) => {
    setSelectedScreenType(type);
  };
  
  // Count total showtimes
  const totalShowtimes = Object.values(groupedShowtimes).reduce((total, screenTypes) => {
    return total + Object.values(screenTypes).reduce((count, showtimes) => 
      count + showtimes.length, 0
    );
  }, 0);
  
  // Format date for display
  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Sort locations alphabetically
  const sortedLocations = Object.keys(groupedShowtimes).sort();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4 pb-16"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{movieTitle}</h1>
          <p className="text-muted-foreground">Showtimes for {formatDate()}</p>
          <div className="flex justify-center items-center space-x-2 mt-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {totalShowtimes} Showtimes
            </Badge>
            <Badge variant="outline" className="bg-secondary/30 border-secondary/20">
              {Object.keys(groupedShowtimes).length} Locations
            </Badge>
          </div>
        </motion.div>
        
        {allScreenTypes.length > 1 && (
          <motion.div variants={itemVariants} className="flex justify-center">
            <Card className="w-full max-w-md backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Screen Type:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant={selectedScreenType === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScreenTypeFilter(null)}
                    className="rounded-full text-xs"
                  >
                    All Types
                  </Button>
                  {allScreenTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedScreenType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScreenTypeFilter(type)}
                      className="rounded-full text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        <ScrollArea className="h-[calc(100vh-320px)] pr-4">
          <motion.div 
            variants={containerVariants}
            className="space-y-6"
          >
            {sortedLocations.map(location => {
              const screenTypes = groupedShowtimes[location];
              const isExpanded = expandedLocations[location] === true;
              
              // Fix for error 1: Changed how we filter screen types
              // Instead of trying to call filter on an object, we create a new object
              let filteredScreenTypes: Record<string, Showtime[]> = {};
              
              if (selectedScreenType && screenTypes[selectedScreenType]) {
                filteredScreenTypes[selectedScreenType] = screenTypes[selectedScreenType];
              } else if (!selectedScreenType) {
                filteredScreenTypes = screenTypes;
              }
              
              // Skip locations that don't have the selected screen type
              if (selectedScreenType && !screenTypes[selectedScreenType]) {
                return null;
              }
              
              return (
                <motion.div
                  key={location}
                  variants={itemVariants}
                  className="group"
                >
                  <Card className="overflow-hidden backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 transition-all hover:shadow-lg">
                    <CardHeader 
                      className="cursor-pointer pb-4"
                      onClick={() => toggleLocation(location)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                              {location}
                            </CardTitle>
                            <CardDescription>
                              {Object.values(screenTypes).flat().length} showtimes available
                            </CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          {isExpanded ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <Separator />
                          <CardContent className="pt-4">
                            {/* Fix for error 2: Explicitly type the entries and use the proper Object.entries method */}
                            {Object.entries(filteredScreenTypes).map(([screenType, showtimes]) => (
                              <div key={screenType} className="mb-4 last:mb-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="secondary" className="rounded-full font-normal">
                                    {screenType}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {showtimes.map((showtime, index) => (
                                    <a 
                                      key={`${showtime.showtime}-${index}`}
                                      href={showtime.bookingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group/item"
                                    >
                                      <div className="flex items-center space-x-2 p-2 bg-background/50 hover:bg-primary/5 rounded-md border border-border hover:border-primary/20 transition-all">
                                        <Clock className="h-4 w-4 text-muted-foreground group-hover/item:text-primary" />
                                        <span className="text-sm font-medium group-hover/item:text-primary transition-colors">
                                          {showtime.showtime}
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/item:text-primary opacity-0 group-hover/item:opacity-100 transition-all ml-auto" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
};

export default ResultsDisplay;
