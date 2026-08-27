import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { products, type ProductCategory } from '../data/struktur';
import TextReveal from '../components/TextReveal';

const Nouveautes = () => {
  const [activeFilter, setActiveFilter] = useState<'tout' | ProductCategory>('tout');

  const filters = [
    { id: 'tout', label: 'Tout' },
    { id: 'sneakers', label: 'Sneakers' },
    { id: 'vetements', label: 'Vêtements' },
    { id: 'accessoires', label: 'Accessoires' },
  ] as const;

  const filteredProducts = activeFilter === 'tout' 
    ? products 
    : products.filter(p => p.category === activeFilter);

  return (
    <div className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="mb-12 md:mb-20">
        <TextReveal 
          text="Nouveautés" 
          className="text-4xl sm:text-5xl md:text-7xl font-display tracking-tight mb-4" 
        />
        <TextReveal 
          text="La sélection du moment." 
          className="text-lg md:text-xl text-theme-ink/70 font-light"
          delay={0.15}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 md:gap-8 mb-12 md:mb-16 border-b border-theme-ink/10 pb-6">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
            className={`text-xs md:text-sm tracking-[0.2em] uppercase transition-colors relative pb-2 ${
              activeFilter === filter.id ? 'text-struktur-orange' : 'text-theme-ink/50 hover:text-theme-ink'
            }`}
          >
            {filter.label}
            {activeFilter === filter.id && (
              <motion.div 
                layoutId="activeFilter"
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-struktur-orange"
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              key={product.id} 
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/5] bg-theme-surface overflow-hidden relative mb-4 md:mb-6 rounded-none">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                  {/* Desktop hover CTA overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex items-center justify-center backdrop-blur-[2px]">
                    {product.detailPath ? (
                      <Link 
                        to={product.detailPath}
                        className="bg-white text-black px-7 py-3.5 font-medium uppercase tracking-widest text-xs transform translate-y-6 group-hover:translate-y-0 transition-all duration-400 ease-out hover:bg-struktur-orange hover:text-white"
                      >
                        Voir
                      </Link>
                    ) : (
                      <Link 
                        to="/le-shop"
                        className="bg-white text-black px-7 py-3.5 font-medium uppercase tracking-widest text-xs transform translate-y-6 group-hover:translate-y-0 transition-all duration-400 ease-out hover:bg-struktur-orange hover:text-white"
                      >
                        Disponible au shop
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <p className="text-xs uppercase tracking-[0.2em] text-struktur-orange mb-1.5 font-semibold">
                    {product.brand}
                  </p>
                  <h3 className="font-display text-lg md:text-2xl mb-1.5 group-hover:text-struktur-orange transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-theme-ink/50 font-light mb-4">
                    {product.variant}
                  </p>
                </div>
              </div>

              {/* Mobile direct CTA button */}
              <div className="md:hidden pt-1">
                {product.detailPath ? (
                  <Link 
                    to={product.detailPath}
                    className="block w-full text-center border border-theme-ink/20 text-theme-ink/90 py-3 text-xs uppercase tracking-widest font-medium active:bg-theme-ink active:text-theme-canvas transition-colors"
                  >
                    Voir
                  </Link>
                ) : (
                  <Link 
                    to="/le-shop"
                    className="block w-full text-center border border-theme-ink/20 text-theme-ink/90 py-3 text-xs uppercase tracking-widest font-medium active:bg-theme-ink active:text-theme-canvas transition-colors"
                  >
                    Disponible au shop
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {filteredProducts.length === 0 && (
        <div className="py-20 text-center text-theme-ink/50 font-light">
          Aucun produit dans cette catégorie pour le moment.
        </div>
      )}
    </div>
  );
};

export default Nouveautes;
