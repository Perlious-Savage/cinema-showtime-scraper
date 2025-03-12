
import React from 'react';
import { motion } from 'framer-motion';
import { FilmIcon } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header 
      className="w-full py-6 px-4 sm:px-6 lg:px-8 backdrop-blur-sm bg-white/40 dark:bg-black/40 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-2" 
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <FilmIcon className="h-7 w-7 text-primary" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold tracking-tight">Cinema Showtimes</h1>
        </motion.div>
        
        <motion.div 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Powered by Firecrawl
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
