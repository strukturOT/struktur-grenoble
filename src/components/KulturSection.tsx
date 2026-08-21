import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { strukturAssets } from '../data/strukturAssets';
import TextReveal from './TextReveal';
import ImageReveal from './ImageReveal';
import MagneticButton from './MagneticButton';

const KulturSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["-5%", "15%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      
      <div className="flex flex-col md:flex-row gap-12 md:gap-8 items-center md:items-start mb-16 md:mb-32">
        <div className="w-full md:w-5/12 pt-8 md:pt-24 order-2 md:order-1">
          <TextReveal 
            text="STRUKTUR / KULTUR" 
            className="text-xs tracking-[0.25em] uppercase text-struktur-orange font-semibold mb-6"
            delay={0.2}
          />
          
          <TextReveal 
            text="L'INDÉPENDANCE COMME STANDARD." 
            className="text-3xl sm:text-4xl md:text-5xl font-display leading-[1.1] mb-8"
            delay={0.3}
          />
          
          <TextReveal 
            text="Plus qu'une boutique, une destination. Nous sélectionnons avec exigence des marques pointues, des matières nobles et des silhouettes modernes pour construire un vestiaire intemporel." 
            className="text-base text-white/70 leading-relaxed max-w-sm mb-10"
            delay={0.4}
          />

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
            <MagneticButton to="/marques">
              <span className="text-xs tracking-widest uppercase border-b border-white/30 pb-1 hover:border-struktur-orange transition-colors">Découvrir nos marques</span>
            </MagneticButton>
          </motion.div>
        </div>

        <div className="w-full md:w-7/12 order-1 md:order-2">
          {/* Main Large Image */}
          <div className="aspect-[4/5] relative overflow-hidden bg-struktur-light">
            <motion.div style={{ y: y1 }} className="absolute -top-[10%] left-0 w-full h-[120%]">
              <ImageReveal 
                src={strukturAssets.editorial.rooftopSeated} 
                alt="Editorial look" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-end justify-end w-full">
        <div className="w-full md:w-1/3 mb-12 md:mb-0">
          <div className="aspect-square relative overflow-hidden bg-struktur-light">
            <motion.div style={{ y: y3 }} className="absolute -top-[10%] left-0 w-full h-[120%]">
              <ImageReveal 
                src={strukturAssets.products.crossbodyTerracotta} 
                alt="Product details" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        <div className="w-full md:w-5/12">
          <div className="aspect-[3/4] relative overflow-hidden bg-struktur-light">
            <motion.div style={{ y: y2 }} className="absolute -top-[10%] left-0 w-full h-[120%]">
              <ImageReveal 
                src={strukturAssets.editorial.rooftopTennis} 
                alt="Lifestyle editorial" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default KulturSection;
