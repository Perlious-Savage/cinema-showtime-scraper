
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import ScrapeForm from '@/components/ScrapeForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Showtime } from '@/utils/showtimeParser';

const Index = () => {
  const [groupedShowtimes, setGroupedShowtimes] = useState<Record<string, Record<string, Showtime[]>> | null>(null);
  const [movieTitle, setMovieTitle] = useState<string>('');

  const handleResults = (results: Record<string, Record<string, Showtime[]>>, title: string) => {
    setGroupedShowtimes(results);
    setMovieTitle(title);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="flex-1 w-full max-w-6xl mx-auto py-8 space-y-8">
        <AnimatePresence mode="wait">
          {!groupedShowtimes ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[50vh] px-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-xl text-center space-y-4 mb-10"
              >
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text">
                  Find Movie Showtimes
                </h1>
                <p className="text-xl text-muted-foreground">
                  Extract cinema locations and showtimes from any movie website
                </p>
              </motion.div>
              
              <ScrapeForm onResults={handleResults} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center mb-8">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                  onClick={() => setGroupedShowtimes(null)}
                >
                  ← Scrape another website
                </motion.button>
              </div>
              
              <ResultsDisplay 
                groupedShowtimes={groupedShowtimes} 
                movieTitle={movieTitle} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm bg-white/40 dark:bg-black/40">
        <p>Cinema Showtimes Scraper • Powered by Firecrawl</p>
      </footer>
    </div>
  );
};

export default Index;
