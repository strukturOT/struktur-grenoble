import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RouteSeo from './RouteSeo';

const ScrollToTop = () => {
  const location = useLocation();
  const previousLocation = useRef(location);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = location;
    const before = new URLSearchParams(previous.search);
    const after = new URLSearchParams(location.search);
    before.delete('variante');
    after.delete('variante');
    // Selecting a shareable size/color keeps the customer at the product controls.
    if (previous.pathname === location.pathname && previous.hash === location.hash
      && previous.search !== location.search && before.toString() === after.toString()) return;
    if (location.hash) {
      const frame = window.requestAnimationFrame(() => {
        const element = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!element) return;
        element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location]);

  return null;
};

const SiteLayout = () => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <>
        <ScrollToTop />
        <main>
          <Outlet />
        </main>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <RouteSeo />
      <div className="min-h-screen bg-theme-canvas text-theme-ink selection:bg-struktur-orange selection:text-white flex flex-col">
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default SiteLayout;
