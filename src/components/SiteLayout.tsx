import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RouteSeo from './RouteSeo';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
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
  }, [location.key, location.pathname, location.search, location.hash]);

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
