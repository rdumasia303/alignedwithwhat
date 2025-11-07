import React from 'react';
import { cn } from '../../lib/utils';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = '' }) => {
  return (
    <div className={cn(
      "relative overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
      className
    )}>
      {children}
    </div>
  );
};
