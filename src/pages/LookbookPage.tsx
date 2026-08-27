import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { lookbookItems } from '../data/struktur';
import TextReveal from '../components/TextReveal';
import ImageReveal from '../components/ImageReveal';

// Custom parallax image component for the lookbook
const ParallaxImage = ({ item, yOffset, className }: { item: any, yOffset: any, className: string }) => {
  return (
    <div className={`relative overflow-hidden group bg-theme-surface ${className}`}>
      <motion.div style={{ y: yOffset }} className="absolute -top-[15%] left-0 w-full h-[130%]">
        <ImageReveal src={item.image} alt={item.label} className="w-full h-full object-cover" />
      </motion.div>
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="text-white text-xs md:text-sm font-medium bg-black/50 px-2 py-1 backdrop-blur-sm w-fit">{item.label}</span>
        <span className="text-white/80 text-[10px] md:text-xs uppercase tracking-widest bg-black/50 px-2 py-1 backdrop-blur-sm w-fit">{item.location}</span>
      </div>
    </div>
  );
};

const LookbookPage = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Different parallax speeds for desktop
  const ySlow = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const yMed = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const yFast = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const yReverse = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <div className="pt-32 pb-24 md:pt-48 md:pb-32 min-h-screen" ref={containerRef}>
      
      {/* Header */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-16 md:mb-24 text-center md:text-left">
        <TextReveal 
          text="Lookbook" 
          className="text-4xl sm:text-5xl md:text-7xl font-display tracking-tight mb-4" 
        />
        <TextReveal 
          text="L'allure Struktur. Automne / Hiver." 
          className="text-lg md:text-xl text-theme-ink/70 font-light"
          delay={0.15}
        />
      </div>

      {/* Grid Layout - Asymmetric and Masonry-like */}
      <div className="px-4 md:px-12 max-w-[1600px] mx-auto w-full">
        
        {/* Row 1 */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 items-center mb-4 md:mb-16">
          <div className="w-full md:w-7/12">
            <ParallaxImage item={lookbookItems[0]} yOffset={yMed} className="aspect-[4/3] md:aspect-[16/9]" />
          </div>
          <div className="w-3/4 md:w-4/12 md:-mt-32">
            <ParallaxImage item={lookbookItems[1]} yOffset={yFast} className="aspect-[3/4]" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 items-start mb-4 md:mb-16">
          <div className="w-full md:w-5/12 hidden md:block mt-24 pl-12 lg:pl-24">
            <div className="max-w-sm">
              <TextReveal text="Des silhouettes pensées pour le quotidien. L'équilibre entre confort, technique et élégance brute." className="text-xl text-theme-ink/70 font-light leading-relaxed" />
            </div>
          </div>
          <div className="w-full md:w-6/12 ml-auto">
            <ParallaxImage item={lookbookItems[2]} yOffset={ySlow} className="aspect-[4/5] md:aspect-[3/4]" />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 items-end mb-4 md:mb-24">
          <div className="w-4/5 md:w-5/12 z-10 md:mb-32">
            <ParallaxImage item={lookbookItems[3]} yOffset={yReverse} className="aspect-square md:aspect-[4/5]" />
          </div>
          <div className="w-full md:w-7/12 -mt-16 md:mt-0">
            <ParallaxImage item={lookbookItems[4]} yOffset={yMed} className="aspect-[3/4] md:aspect-[4/5]" />
          </div>
        </div>

        {/* Row 4 */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-12 items-center mb-4 md:mb-16 justify-center">
          <div className="w-full md:w-8/12">
            <ParallaxImage item={lookbookItems[9]} yOffset={ySlow} className="aspect-[16/9] md:aspect-[21/9]" />
          </div>
        </div>

        {/* Row 5 */}
        <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-8 lg:gap-16 items-start">
          <div className="w-full md:w-6/12">
            <ParallaxImage item={lookbookItems[5]} yOffset={yFast} className="aspect-[3/4]" />
          </div>
          <div className="w-3/4 md:w-4/12 mt-8 md:mt-48">
            <ParallaxImage item={lookbookItems[8]} yOffset={yReverse} className="aspect-[4/5]" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LookbookPage;
