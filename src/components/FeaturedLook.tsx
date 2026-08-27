import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { strukturAssets } from '../data/strukturAssets';
import TextReveal from './TextReveal';

const FeaturedLook = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10 md:mb-16">
        <div>
          <TextReveal 
            text="Featured Look"
            className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold mb-2"
            delay={0}
          />
          <TextReveal 
            text="L'Allure Struktur"
            className="text-4xl md:text-5xl font-display tracking-tight"
            delay={0.15}
          />
        </div>
      </div>

      <div ref={containerRef} className="relative w-full aspect-[4/5] md:aspect-[21/9] overflow-hidden group bg-theme-surface mb-8">
        <motion.div style={{ y }} className="absolute -top-[15%] left-0 w-full h-[130%]">
          <img 
            src={strukturAssets.lookbook.streetGraffiti}
            alt="Featured Look"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        
        {/* Overlay gradient for text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Content on top of image */}
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-10">
          <p className="text-white font-medium text-lg md:text-2xl mb-2">Look 005 / Rue</p>
          <p className="text-white/70 text-sm tracking-wide uppercase">Daily Paper Hoodie & Chino</p>
        </div>
      </div>

      <div className="flex justify-center md:justify-end">
        <Link 
          to="/lookbook"
          className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase font-medium border border-theme-ink/20 px-8 py-4 hover:bg-theme-ink hover:text-theme-canvas transition-colors"
        >
          Voir le lookbook
          <span className="transform group-hover:translate-x-2 transition-transform duration-300">→</span>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedLook;
