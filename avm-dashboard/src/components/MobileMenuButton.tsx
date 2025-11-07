import React from 'react';
import { Menu } from 'lucide-react';

interface MobileMenuButtonProps {
  onClick: () => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-50 p-3 bg-neural-darker/90 backdrop-blur-sm border border-neural-light/10 rounded-lg shadow-lg lg:hidden hover:bg-neural-darker transition-colors"
    >
      <Menu className="w-6 h-6 text-neural-light" />
    </button>
  );
};
