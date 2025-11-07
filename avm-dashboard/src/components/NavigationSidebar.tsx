import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface NavigationSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeView,
  onViewChange,
  menuItems
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuItemClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false); // Close mobile menu when item is clicked
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <AnimatePresence>
        {!isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-0 left-0 right-0 z-50 lg:hidden"
          >
            {/* Opaque header background */}
            <div className="bg-neural-dark/95 backdrop-blur-md border-b border-neural-light/10 px-4 py-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="bg-neural-darker/90 backdrop-blur-sm border border-neural-light/20 p-2 rounded-lg text-neural-light hover:text-avm-cyan transition-colors"
                  title="Explore more"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="text-neural-light text-sm font-medium bg-neural-darker/90 backdrop-blur-sm border border-neural-light/20 px-3 py-2 rounded-lg">
                  Explore more
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always Visible */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-neural-darker/95 backdrop-blur-md border-r border-neural-light/10 z-40 flex-col"
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-neural-light/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-avm-purple to-avm-cyan rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">?</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neural-light">Aligned With What?</h2>
              <p className="text-xs text-neural-muted">AI Moral Chameleons</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-avm-purple/20 text-avm-purple border border-avm-purple/30' 
                    : 'text-neural-light hover:bg-neural-light/5 hover:text-avm-cyan'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 bg-avm-purple rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-neural-darker/98 backdrop-blur-md border-r border-neural-light/10 z-50 lg:hidden flex flex-col"
            >
              {/* Mobile Header with Close Button */}
              <div className="p-4 border-b border-neural-light/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-avm-purple to-avm-cyan rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-white">?</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neural-light">Aligned With What?</h2>
                    <p className="text-xs text-neural-muted">AI Moral Chameleons</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-neural-light hover:text-avm-cyan transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Menu */}
              <nav className="p-4 space-y-2 flex-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                        transition-all duration-200 text-left
                        ${isActive 
                          ? 'bg-avm-purple/20 text-avm-purple border border-avm-purple/30' 
                          : 'text-neural-light hover:bg-neural-light/5 hover:text-avm-cyan'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="mobileActiveIndicator"
                          className="ml-auto w-2 h-2 bg-avm-purple rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
