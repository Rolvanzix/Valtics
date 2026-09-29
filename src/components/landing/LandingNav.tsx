import React, { useState, useEffect } from 'react';
import { ValticsLogo } from '../brand/ValticsLogo';
import { ArrowRight, Menu, X } from 'lucide-react';
import { NavigationTab } from '../layout/Header';

interface LandingNavProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onEnterApp,
  onNavigateSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#06080d]/90 backdrop-blur-md border-b border-white/[0.06] py-3.5'
          : 'bg-transparent border-b border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer flex items-center select-none group"
        >
          <ValticsLogo size="md" showText={true} tagline={false} glow={false} />
        </div>

        {/* Minimal Navigation Links: Platform, How It Works, Studio, Enter Valtics */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-xs font-mono tracking-wider uppercase">
          <button
            type="button"
            onClick={() => onNavigateSection('system')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            Platform
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('transformation')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => onEnterApp('studio')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            Studio
          </button>
        </nav>

        {/* Primary Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => onEnterApp('overview')}
            className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wide text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.24] rounded-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <span>Enter Valtics</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#06080d] border-b border-white/[0.08] px-6 py-6 space-y-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection('system');
              }}
              className="w-full text-left px-2 py-2 text-sm font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection('transformation');
              }}
              className="w-full text-left px-2 py-2 text-sm font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onEnterApp('studio');
              }}
              className="w-full text-left px-2 py-2 text-sm font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              Studio
            </button>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onEnterApp('overview');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono text-zinc-950 bg-white rounded-md cursor-pointer"
            >
              <span>Enter Valtics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
