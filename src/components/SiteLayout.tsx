import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SmoothScroll from './SmoothScroll';
import { useLenisInstance } from './LenisContext';
import RouteSeo from './RouteSeo';

const ScrollToTop = () => {
  const location = useLocation();
  const lenis = useLenisInstance();

  useEffect(() => {
    if (location.hash) {
      const timeout = window.setTimeout(() => {
        const element = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!element) return;
        if (lenis) lenis.scrollTo(element, { offset: -96 });
        else element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => window.clearTimeout(timeout);
    } else {
      const frame = window.requestAnimationFrame(() => {
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [location.key, location.pathname, location.search, location.hash, lenis]);

  return null;
};

const SiteLayout = () => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <SmoothScroll>
        <ScrollToTop />
        <main>
          <Outlet />
        </main>
      </SmoothScroll>
    );
  }

  return (
    <SmoothScroll>
      <ScrollToTop />
      <RouteSeo />
      <div className="min-h-screen bg-theme-canvas text-theme-ink selection:bg-struktur-orange selection:text-white flex flex-col">
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
};

export default SiteLayout;
