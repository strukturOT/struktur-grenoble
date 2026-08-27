import React from 'react';
import { motion } from 'framer-motion';
import { brandNames } from '../data/struktur';

const BrandsMarquee = () => {
  return (
    <section className="py-10 md:py-20 overflow-hidden border-y border-theme-section-ink/5 bg-theme-section">
      <div className="flex w-[300%] sm:w-[200%] md:w-[150%]">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
          className="flex whitespace-nowrap items-center"
        >
          {/* Double the array for seamless looping */}
          {[...brandNames, ...brandNames].map((brand, index) => (
            <div key={index} className="flex items-center">
              <span className="text-2xl sm:text-4xl md:text-6xl font-display font-bold uppercase text-theme-section-ink/20 px-4 sm:px-8 hover:text-struktur-orange transition-colors duration-300">
                {brand}
              </span>
              <span className="text-lg sm:text-2xl text-struktur-orange">•</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsMarquee;
