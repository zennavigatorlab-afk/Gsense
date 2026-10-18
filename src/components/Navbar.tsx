import React, { useState } from 'react';
import { Logo } from './Logo';
import { Moon, Sun, Menu, X, User as UserIcon, BarChart2 } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
  userEmail,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'docs', label: 'Docs' },
    { id: 'privacy', label: 'Privacy' },
  ];

  const handleLinkClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          aria-label="G-SENSE Home"
        >
          <Logo size={30} showText={true} />
        </button>

        {/* Zone 2: 4-5 Concise Single-Line Text Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white cursor-pointer py-1 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Profile / Auth CTA */}
          {userEmail ? (
            <button
              onClick={() => handleLinkClick('profile')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                currentPage === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Profile</span>
            </button>
          ) : (
            <button
              onClick={() => handleLinkClick('auth')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-sm"
            >
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                  currentPage === link.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleLinkClick('contact')}
              className={`px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                currentPage === 'contact'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              Contact
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
