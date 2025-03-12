
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { crawlWebsite } from '@/utils/firecrawl';
import { extractShowtimes, groupShowtimes, Showtime } from '@/utils/showtimeParser';

interface ScrapeFormProps {
  onResults: (groupedShowtimes: Record<string, Record<string, Showtime[]>>, movie: string) => void;
}

const ScrapeForm: React.FC<ScrapeFormProps> = ({ onResults }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const [movieName, setMovieName] = useState('');

  // Extract movie name from URL
  const extractMovieName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the movies part and get the next segment
      const moviesIndex = pathParts.findIndex(part => part === 'movies');
      if (moviesIndex !== -1 && moviesIndex < pathParts.length - 1) {
        // Convert slug to readable name
        return pathParts[moviesIndex + 1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/#.*$/, ''); // Remove any hash fragments
      }
      return 'Movie';
    } catch {
      return 'Movie';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid movie showtimes URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setProgress(10);
    
    try {
      // Extract movie name from URL
      const movieTitle = extractMovieName(url);
      setMovieName(movieTitle);
      
      toast({
        title: "Scraping Started",
        description: `Getting showtimes for "${movieTitle}"`,
      });
      
      // Start the scraping process
      setProgress(30);
      const result = await crawlWebsite(url);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to scrape website');
      }
      
      setProgress(70);
      
      // Process the results if we have data
      if (result.data && result.data.length > 0) {
        const markdown = result.data[0].markdown;
        
        // Extract showtimes from the markdown
        const showtimes = extractShowtimes(markdown);
        
        if (showtimes.length === 0) {
          throw new Error('No showtimes found in the scraped content');
        }
        
        // Group the showtimes for better display
        const groupedShowtimes = groupShowtimes(showtimes);
        
        // Pass the results up to the parent component
        onResults(groupedShowtimes, movieTitle);
        
        setProgress(100);
        toast({
          title: "Success",
          description: `Found ${showtimes.length} showtimes across ${Object.keys(groupedShowtimes).length} locations`,
        });
      } else {
        throw new Error('No data returned from scraping');
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      toast({
        title: "Scraping Failed",
        description: error instanceof Error ? error.message : 'An error occurred during scraping',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <Card className="overflow-hidden backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-center">Enter Movie Showtimes URL</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Paste a URL from a cinema website to extract showtimes
                </p>
              </div>
              
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com/movies/movie-name"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pr-10 h-12 bg-background/50 backdrop-blur-xs border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-lg"
                  disabled={isLoading}
                  required
                />
                <Search className="absolute right-3 top-3 text-muted-foreground h-5 w-5" />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Scraping...</span>
                  </div>
                ) : (
                  "Extract Showtimes"
                )}
              </Button>
              
              {isLoading && (
                <motion.div 
                  className="relative h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="absolute h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScrapeForm;
