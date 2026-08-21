import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { brands } from '../data/struktur';
import TextReveal from '../components/TextReveal';
import ImageReveal from '../components/ImageReveal';

const Marques = () => {
  const featuredBrands = brands.filter(b => b.featured);
  const directoryBrands = brands.filter(b => !b.featured);

  return (
    <div className="pt-32 pb-24 md:pt-48 md:pb-32 min-h-screen">
      
      {/* Header */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-20 md:mb-32">
        <TextReveal 
          text="Marques" 
          className="text-4xl sm:text-5xl md:text-7xl font-display tracking-tight mb-4" 
        />
        <TextReveal 
          text="Une sélection indépendante." 
          className="text-lg md:text-xl text-white/70 font-light" 
          delay={0.15}
        />
      </div>

      {/* Featured Brands */}
      <div className="flex flex-col gap-24 md:gap-40 mb-32 md:mb-48">
        {featuredBrands.map((brand, idx) => (
          <div key={brand.slug} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-16 px-6 md:px-12 max-w-7xl mx-auto w-full items-center`}>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6 }}
                className="mb-6 md:mb-10"
              >
                <span className="text-struktur-orange font-display text-2xl md:text-4xl opacity-50 block mb-4">
                  0{idx + 1}
                </span>
                <h2 className="text-4xl md:text-6xl font-display leading-[1.1] mb-4">
                  {brand.name}
                </h2>
                <p className="text-white/50 text-sm uppercase tracking-widest">
                  {brand.category}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link to="/nouveautes" className="inline-block text-xs uppercase tracking-[0.2em] border-b border-white/20 pb-1 hover:text-struktur-orange hover:border-struktur-orange transition-colors">
                  Découvrir la sélection
                </Link>
              </motion.div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="aspect-[4/5] bg-struktur-light overflow-hidden relative">
                {brand.image && (
                  <ImageReveal src={brand.image} alt={brand.name} className="w-full h-full object-cover" />
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Directory */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto border-t border-white/10 pt-20">
        <div className="mb-12">
          <TextReveal 
            text="Index des marques" 
            className="text-sm tracking-[0.3em] uppercase text-struktur-orange font-semibold" 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {directoryBrands.map((brand, idx) => (
            <motion.div 
              key={brand.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              className="group border-b border-white/5 pb-4"
            >
              <h3 className="text-2xl font-display mb-2 group-hover:text-struktur-orange transition-colors">
                {brand.name}
              </h3>
              <p className="text-white/40 text-xs uppercase tracking-widest">
                {brand.category}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Marques;
