import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { strukturAssets } from '../data/strukturAssets';
import MagneticButton from './MagneticButton';
import TextReveal from './TextReveal';

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] h-screen w-full overflow-hidden bg-struktur-dark flex items-center justify-center">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={shouldReduceMotion ? { scale: 1, filter: "blur(0px)" } : { scale: 1.1, filter: "blur(20px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-full h-full"
        >
          <img 
            src={strukturAssets.home.hero} 
            alt="Struktur Grenoble Rooftop" 
            fetchPriority="high"
            className="w-full h-full object-cover object-[75%_center] md:object-center"
          />
        </motion.div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-struktur-dark/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 md:px-12 text-center pt-16 md:pt-0">
        
        <div className="mb-3 md:mb-4">
          <TextReveal text="G R E N O B L E" className="text-xs sm:text-sm md:text-base tracking-[0.35em] md:tracking-[0.4em] uppercase text-struktur-orange font-semibold" delay={0.2} />
        </div>

        <TextReveal text="STRUKTUR" className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-display font-bold tracking-widest text-white mb-4 md:mb-6" delay={0.4} />
        
        <div className="max-w-xl mx-auto mb-8 md:mb-12">
          <TextReveal text="Le concept store premium. Sélection indépendante de streetwear, sneakers et créateurs." className="text-base md:text-xl text-white/80 font-light" delay={0.6} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-8 w-full max-w-xs sm:max-w-none"
        >
          <MagneticButton to="/nouveautes" className="w-full sm:w-auto">
            <div className="px-6 py-3.5 md:px-8 md:py-4 bg-struktur-orange text-white font-medium hover:bg-[#ff5511] transition-colors rounded-none w-full tracking-wide text-xs md:text-base text-center uppercase sm:normal-case">
              Voir les nouveautés
            </div>
          </MagneticButton>

          <MagneticButton to="/le-shop" className="w-full sm:w-auto">
            <div className="px-6 py-3.5 md:px-8 md:py-4 border border-white/30 text-white font-medium hover:bg-white hover:text-black transition-colors rounded-none w-full tracking-wide backdrop-blur-sm text-xs md:text-base text-center uppercase sm:normal-case">
              Découvrir la boutique
            </div>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
