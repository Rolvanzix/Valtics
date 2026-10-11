import React, { useState, useEffect } from 'react';
import { ValticsLogo } from '../brand/ValticsLogo';
import { Menu, X, Wallet } from 'lucide-react';
import { NavigationTab } from '../layout/Header';

interface LandingNavProps {
  onEnterApp: (targetTab?: NavigationTab) => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenWalletModal?: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onEnterApp,
  onNavigateSection,
  onOpenWalletModal,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'about' | 'docs'>('home');

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
          ? 'bg-[#000010]/90 backdrop-blur-md border-b border-[rgba(138,32,255,0.18)] py-3'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer flex items-center select-none group"
        >
          <ValticsLogo size="md" showText={true} tagline={false} glow={true} />
        </div>

        {/* Center Minimal Navigation Links: Home, About, Docs */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-sans">
          <button
            type="button"
            onClick={() => {
              setActiveNav('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="relative text-[#F5F5F7] font-medium transition-colors cursor-pointer py-1"
          >
            <span>Home</span>
            {activeNav === 'home' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6010F0] via-[#D82AA8] to-[#FF8A20] rounded-full" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveNav('about');
              onNavigateSection('system');
            }}
            className="relative text-[#A7A7B8] hover:text-[#F5F5F7] font-normal transition-colors cursor-pointer py-1"
          >
            <span>About</span>
            {activeNav === 'about' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6010F0] via-[#D82AA8] to-[#FF8A20] rounded-full" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveNav('docs');
              onNavigateSection('transformation');
            }}
            className="relative text-[#A7A7B8] hover:text-[#F5F5F7] font-normal transition-colors cursor-pointer py-1"
          >
            <span>Docs</span>
            {activeNav === 'docs' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6010F0] via-[#D82AA8] to-[#FF8A20] rounded-full" />
            )}
          </button>
        </nav>

        {/* Right Action Buttons: Launch App + Connect Wallet */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEnterApp('overview')}
            className="valtics-button text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Launch App</span>
            <span className="text-white text-xs">→</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenWalletModal) {
                onOpenWalletModal();
              } else {
                onEnterApp('overview');
              }
            }}
            className="valtics-button-secondary text-xs font-semibold hover:border-[#8A20FF] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            <span>Connect Wallet</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#05051a] border-b border-[rgba(138,32,255,0.25)] px-6 py-6 space-y-4 font-sans">
          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveNav('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left text-sm text-[#F5F5F7] font-medium py-1.5"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveNav('about');
                onNavigateSection('system');
              }}
              className="text-left text-sm text-[#A7A7B8] hover:text-[#F5F5F7] py-1.5"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveNav('docs');
                onNavigateSection('transformation');
              }}
              className="text-left text-sm text-[#A7A7B8] hover:text-[#F5F5F7] py-1.5"
            >
              Docs
            </button>
          </div>

          <div className="pt-2 border-t border-[rgba(138,32,255,0.18)] space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onEnterApp('overview');
              }}
              className="w-full valtics-button text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5"
            >
              <span>Launch App</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenWalletModal) {
                  onOpenWalletModal();
                } else {
                  onEnterApp('overview');
                }
              }}
              className="w-full valtics-button-secondary text-xs font-semibold py-2"
            >
              <span>Connect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
