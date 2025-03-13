
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { crawlWebsite } from '@/utils/firecrawl';
import { extractShowtimes, groupShowtimes, parseRawNovoText, Showtime } from '@/utils/showtimeParser';

interface ScrapeFormProps {
  onResults: (groupedShowtimes: Record<string, Record<string, Showtime[]>>, movie: string) => void;
}

const ScrapeForm: React.FC<ScrapeFormProps> = ({ onResults }) => {
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const [movieName, setMovieName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('url');

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

  const handleURLSubmit = async (e: React.FormEvent) => {
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
      
      // Start the scraping process with increased timeout
      setProgress(30);
      const result = await crawlWebsite(url);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to scrape website');
      }
      
      setProgress(70);
      
      // Process the results if we have data
      if (result.data && result.data.length > 0) {
        console.log("Received data from Firecrawl:", result.data);
        
        // Get the markdown content from the first data item
        const markdown = result.data[0].markdown;
        console.log("Markdown length:", markdown.length);
        
        // Extract showtimes from the markdown
        const showtimes = extractShowtimes(markdown);
        console.log("Extracted showtimes:", showtimes);
        
        if (showtimes.length === 0) {
          throw new Error('No showtimes found in the scraped content');
        }
        
        // Group the showtimes for better display
        const groupedShowtimes = groupShowtimes(showtimes);
        console.log("Grouped showtimes:", groupedShowtimes);
        console.log("Number of locations:", Object.keys(groupedShowtimes).length);
        
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

  const handleRawTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rawText.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter the showtime data",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setProgress(30);
    
    try {
      // Use a default movie name if not provided
      const movieTitle = movieName || "Movie Showtimes";
      
      // Parse the raw text to extract showtimes
      const showtimes = parseRawNovoText(rawText);
      console.log("Extracted showtimes from text:", showtimes);
      
      if (showtimes.length === 0) {
        throw new Error('No showtimes could be extracted from the text. Please check the format.');
      }
      
      setProgress(70);
      
      // Group the showtimes for better display
      const groupedShowtimes = groupShowtimes(showtimes);
      console.log("Grouped showtimes from text:", groupedShowtimes);
      console.log("Number of locations:", Object.keys(groupedShowtimes).length);
      
      // Pass the results up to the parent component
      onResults(groupedShowtimes, movieTitle);
      
      setProgress(100);
      toast({
        title: "Success",
        description: `Found ${showtimes.length} showtimes across ${Object.keys(groupedShowtimes).length} locations`,
      });
    } catch (error) {
      console.error('Error processing text:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'An error occurred while processing the text',
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="url" className="text-sm">From URL</TabsTrigger>
                <TabsTrigger value="text" className="text-sm">Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="mt-0">
                <form onSubmit={handleURLSubmit} className="space-y-6">
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
                </form>
              </TabsContent>
              
              <TabsContent value="text" className="mt-0">
                <form onSubmit={handleRawTextSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-center">Paste Showtimes Text</h2>
                    <p className="text-sm text-muted-foreground text-center">
                      Paste formatted showtimes text to process directly
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Movie Title (Optional)"
                        value={movieName}
                        onChange={(e) => setMovieName(e.target.value)}
                        className="h-12 bg-background/50 backdrop-blur-xs border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-lg"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="relative">
                      <Textarea
                        placeholder="Paste showtimes text here...
Format: 
Cinema Name
Language
Time
Screen Type
Time
Screen Type
..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="min-h-[200px] bg-background/50 backdrop-blur-xs border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-lg"
                        disabled={isLoading}
                        required
                      />
                      <FileText className="absolute right-3 top-3 text-muted-foreground h-5 w-5" />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Process Showtimes"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {isLoading && (
              <motion.div 
                className="relative h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-6"
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
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScrapeForm;
