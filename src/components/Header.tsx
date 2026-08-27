import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { navigation, storeInfo } from '../data/struktur';
import { Logo } from './Logo';
import { useTheme } from '../theme/themeContext';

const ThemeToggle = ({ overImage = false, showLabel = false }: { overImage?: boolean; showLabel?: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Activer le thème sombre' : 'Activer le thème clair'}
      aria-pressed={isLight}
      title={isLight ? 'Passer au thème sombre' : 'Passer au thème clair'}
      className={`group -m-2 flex min-h-11 items-center gap-3 rounded-full p-2 ${
        overImage ? 'text-white' : 'text-theme-ink'
      }`}
    >
      {showLabel && (
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">
          {isLight ? 'Clair' : 'Sombre'}
        </span>
      )}
      <span className={`relative block h-7 w-12 rounded-full border transition-colors ${
        overImage
          ? 'border-white/20 bg-white/5 group-hover:border-white/50'
          : 'border-theme-ink/20 bg-theme-ink/5 group-hover:border-theme-ink/50'
      }`}>
        <motion.span
          aria-hidden="true"
          animate={{ x: isLight ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute left-0 top-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-current shadow-sm"
        >
          {isLight ? (
            <Sun size={12} className={overImage ? 'text-black' : 'text-theme-canvas'} strokeWidth={2.2} />
          ) : (
            <Moon size={11} className={overImage ? 'text-black' : 'text-theme-canvas'} strokeWidth={2.2} />
          )}
        </motion.span>
      </span>
    </button>
  );
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isOverHero = location.pathname === '/' && !isScrolled && !isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-700 ${isMobileMenuOpen ? 'bg-transparent py-4' : isScrolled ? 'glass py-4' : 'bg-transparent py-6 md:py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center relative z-50">
        <Link to="/" onClick={handleLogoClick} className={`${isOverHero ? 'text-white' : 'text-theme-ink'} hover:text-struktur-orange transition-colors duration-500 block h-5 md:h-6`}>
          <Logo variant="wordmark" className="h-full" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex space-x-8">
            {navigation.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xs font-medium tracking-[0.15em] uppercase transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1px] after:bg-current hover:after:w-full after:transition-all after:duration-500 ${
                  location.pathname === link.path
                    ? `${isOverHero ? 'text-white' : 'text-theme-ink'} after:w-full`
                    : `${isOverHero ? 'text-white/70 hover:text-white' : 'text-theme-ink/60 hover:text-theme-ink'}`
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <span className={`h-4 w-px ${isOverHero ? 'bg-white/20' : 'bg-theme-ink/15'}`} />
          <ThemeToggle overImage={isOverHero} showLabel />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle overImage={isOverHero} />
          <button
            className={`${isOverHero ? 'text-white' : 'text-theme-ink'} relative z-50`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-screen bg-theme-canvas/95 text-theme-ink backdrop-blur-xl z-40 flex flex-col justify-between items-center pt-32 pb-16 px-6 md:hidden"
          >
            {/* Main Nav Links */}
            <div className="flex flex-col items-center space-y-8">
              {navigation.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Link 
                    to={link.path}
                    className={`text-3xl font-display tracking-widest uppercase transition-colors ${
                      location.pathname === link.path ? 'text-struktur-orange' : 'text-theme-ink/90 hover:text-struktur-orange'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Bottom — Instagram + Grenoble */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col items-center gap-3"
            >
              <a 
                href={storeInfo.instagram}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs tracking-[0.2em] uppercase text-theme-ink/50 hover:text-struktur-orange transition-colors"
              >
                Instagram
              </a>
              <span className="text-xs tracking-[0.3em] uppercase text-theme-ink/30">
                {storeInfo.city}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
