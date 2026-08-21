import React from 'react';
import { motion } from 'framer-motion';
import { strukturAssets } from '../data/strukturAssets';
import TextReveal from './TextReveal';
import ImageReveal from './ImageReveal';

const BoutiqueAtmosphere = () => {
  const points = [
    { title: "Sélection indépendante", desc: "Des marques pointues, introuvables ailleurs à Grenoble." },
    { title: "Pièces premium", desc: "Qualité des matières, coupes travaillées, durabilité." },
    { title: "L'Espace", desc: "Une atmosphère brute, briques apparentes et conseils personnalisés." }
  ];

  return (
    <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
        <div className="w-full lg:w-1/2 relative z-10">
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden group bg-struktur-light">
              <ImageReveal src={strukturAssets.shop.interiorWide} alt="Boutique Interior" className="w-full h-full" />
            </div>
            {/* Accompanying smaller image */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="md:absolute md:-bottom-16 md:-right-12 md:w-1/2 md:aspect-[3/4] mt-6 md:mt-0 w-3/4 aspect-[4/3] overflow-hidden md:border-8 md:border-struktur-dark md:bg-struktur-light"
            >
              <ImageReveal src={strukturAssets.shop.mirrorCream} alt="Boutique Details" className="w-full h-full" delay={0.2} />
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center lg:pl-12 relative z-20 mt-6 lg:mt-0">
          <div className="mb-2">
            <span className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold">
              Inside Struktur
            </span>
          </div>
          <TextReveal 
            text="Un espace pensé comme une sélection." 
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display mb-6 md:mb-8 leading-[1.15] tracking-tight"
            delay={0.2}
          />
          <TextReveal 
            text="Briques apparentes, bois brut, et un agencement pensé pour mettre en valeur chaque pièce et chaque créateur."
            className="text-white/70 mb-8 md:mb-12 text-base md:text-lg font-light leading-relaxed max-w-lg"
            delay={0.35}
          />

          <div className="space-y-8 md:space-y-10">
            {points.map((point, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 + (idx * 0.1), ease: "easeOut" }}
                key={idx} 
                className="flex gap-5 md:gap-6 group"
              >
                <div className="text-struktur-orange font-display text-xl md:text-3xl font-light opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold font-display text-lg md:text-xl mb-1 md:mb-2 tracking-wide group-hover:text-struktur-orange transition-colors duration-500">{point.title}</h4>
                  <p className="text-white/50 text-sm md:text-base font-light">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoutiqueAtmosphere;
