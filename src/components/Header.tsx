import { useEffect, useState, type MouseEvent } from 'react';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { navigation, storeInfo } from '../data/struktur';
import { Logo } from './Logo';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const reduceMotion = useReducedMotion();

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return;
    event.preventDefault();
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-theme-ink/10 bg-theme-canvas text-theme-ink">
      <div className="relative z-50 mx-auto grid h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-3 md:flex md:h-20 md:justify-between md:px-10 lg:px-14">
        <button type="button" className="flex h-11 w-11 items-center justify-center md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-controls="mobile-navigation" aria-expanded={isMobileMenuOpen}>{isMobileMenuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        <Link to="/" aria-label="Accueil STRUKTUR" onClick={handleLogoClick} className="block h-6 transition-colors hover:text-struktur-orange md:h-7"><Logo className="h-full" /></Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 md:flex lg:gap-8">{navigation.map((link) => <Link key={link.path} to={link.path} aria-current={location.pathname === link.path ? 'page' : undefined} className={`border-b py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors lg:text-xs ${location.pathname === link.path ? 'border-theme-ink' : 'border-transparent text-theme-ink/70 hover:border-theme-ink hover:text-theme-ink'}`}>{link.name}</Link>)}</nav>
        <div className="flex items-center justify-end md:gap-1">
          <Link to="/compte" aria-label={user ? 'Mon compte' : 'Connexion'} className="flex h-11 w-11 items-center justify-center transition-colors hover:text-struktur-orange"><UserRound size={20} /></Link>
          <Link to="/panier" aria-label={`Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}`} className="relative flex h-11 w-11 items-center justify-center transition-colors hover:text-struktur-orange"><ShoppingBag size={20} />{itemCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-theme-ink px-1 text-[9px] text-white">{itemCount}</span>}</Link>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div id="mobile-navigation" initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="fixed inset-x-0 bottom-0 top-[72px] flex flex-col justify-between overflow-y-auto overscroll-y-contain bg-theme-canvas px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 md:hidden">
          <nav aria-label="Navigation mobile" className="flex flex-col">{navigation.map((link) => <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} aria-current={location.pathname === link.path ? 'page' : undefined} className={`border-b border-theme-ink/10 py-4 font-display text-3xl font-medium transition-colors ${location.pathname === link.path ? 'text-struktur-orange' : 'hover:text-struktur-orange'}`}>{link.name}</Link>)}</nav>
          <div className="mt-10 flex items-center justify-between text-xs text-theme-ink/65"><a href={storeInfo.instagram} target="_blank" rel="noopener noreferrer" className="py-3 hover:text-struktur-orange">Instagram</a><span>{storeInfo.city}</span></div>
        </motion.div>}
      </AnimatePresence>
    </header>
  );
}
