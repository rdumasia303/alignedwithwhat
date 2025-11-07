import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  gradient = false 
}) => {
  const baseClasses = `
    bg-neural-darker/80 backdrop-blur-sm 
    border border-neural-light/10 
    rounded-xl 
    shadow-xl shadow-avm-purple/5
    transition-all duration-300
    ${onClick ? 'cursor-pointer hover:border-avm-purple/30 hover:shadow-avm-purple/10' : ''}
    ${gradient ? 'bg-gradient-to-br from-neural-darker/90 to-neural-dark/50' : ''}
    ${className}
  `;

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={baseClasses}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};
