import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative select-none pointer-events-none"
    >
      {/* 
        This empty space is intentional to showcase the premium background scenery.
        No widgets, cards, or progress statistics are rendered here.
      */}
    </motion.div>
  );
};
