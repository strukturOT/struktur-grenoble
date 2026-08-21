import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SmoothScroll from './SmoothScroll';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Slight delay to ensure DOM is ready and Lenis can catch the jump
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const SiteLayout = () => {
  return (
    <SmoothScroll>
      <ScrollToTop />
      <div className="min-h-screen bg-struktur-dark text-struktur-light selection:bg-struktur-orange selection:text-white flex flex-col">
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
