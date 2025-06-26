
import React, { useState } from 'react';
import type { PageKey } from '../types';
import { MenuIcon, XIcon } from './Icons'; // Import new icons

interface HeaderProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NavLink: React.FC<{
  page: PageKey;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
  isMobile?: boolean; // Added isMobile prop
}> = ({ page, currentPage, onNavigate, children, isMobile }) => {
  const isActive = currentPage === page;
  
  const baseClasses = "rounded-md font-medium transition-colors duration-150";
  const activeClasses = isActive ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";
  
  // Apply different padding and text size for mobile links
  const layoutClasses = isMobile 
    ? "block w-full text-left px-3 py-2 text-base" 
    : "px-3 py-2 text-sm";

  return (
    <button
      onClick={() => onNavigate(page)}
      className={`${baseClasses} ${layoutClasses} ${activeClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileLinkClick = (page: PageKey) => {
    onNavigate(page);
    setIsMobileMenuOpen(false); // Close menu after navigation
  };

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Updated logo image path and alt text */}
            <img src="/images/videyo-logo.png" alt="VideYO Logo" className="h-8 w-auto mr-2" />
            {/* Updated header title text */}
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              VideYO
            </span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink page="ai-video-gen" currentPage={currentPage} onNavigate={onNavigate}>
                AI Video Gen
              </NavLink>
              <NavLink page="bk-ground-swap" currentPage={currentPage} onNavigate={onNavigate}>
                BG Swap
              </NavLink>
              <NavLink page="combine-clips" currentPage={currentPage} onNavigate={onNavigate}>
                Combine Clips
              </NavLink>
            </div>
          </div>
          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink page="ai-video-gen" currentPage={currentPage} onNavigate={handleMobileLinkClick} isMobile>
              AI Video Gen
            </NavLink>
            <NavLink page="bk-ground-swap" currentPage={currentPage} onNavigate={handleMobileLinkClick} isMobile>
              BG Swap
            </NavLink>
            <NavLink page="combine-clips" currentPage={currentPage} onNavigate={handleMobileLinkClick} isMobile>
              Combine Clips
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};
