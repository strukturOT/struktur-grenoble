import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { navigation, storeInfo } from '../data/struktur';
import { Logo } from './Logo';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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
    <header className={`fixed top-0 w-full z-50 transition-all duration-700 ${isScrolled || isMobileMenuOpen ? 'glass py-4' : 'bg-transparent py-6 md:py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center relative z-50">
        <Link to="/" onClick={handleLogoClick} className="text-white hover:text-struktur-orange transition-colors duration-500 block h-5 md:h-6">
          <Logo variant="wordmark" className="h-full" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-8">
          {navigation.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`text-xs font-medium tracking-[0.15em] uppercase transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1px] after:bg-white hover:after:w-full after:transition-all after:duration-500 ${
                location.pathname === link.path ? 'text-white after:w-full' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white relative z-50" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-screen bg-struktur-dark/98 backdrop-blur-xl z-40 flex flex-col justify-between items-center pt-32 pb-16 px-6 md:hidden"
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
                      location.pathname === link.path ? 'text-struktur-orange' : 'text-white/90 hover:text-struktur-orange'
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
                className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-struktur-orange transition-colors"
              >
                Instagram
              </a>
              <span className="text-xs tracking-[0.3em] uppercase text-white/30">
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
