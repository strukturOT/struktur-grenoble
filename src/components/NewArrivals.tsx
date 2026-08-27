import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { products } from '../data/struktur';
import TextReveal from './TextReveal';

const NewArrivals = () => {
  // Take only the first 3 products for the homepage
  const featuredProducts = products.slice(0, 3);

  return (
    <section className="py-16 md:py-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4 md:gap-6">
        <div>
          <div className="mb-2">
            <span className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold">
              Just Dropped
            </span>
          </div>
          <TextReveal 
            text="Nouveautés"
            className="text-4xl md:text-6xl font-display mb-3 md:mb-4 tracking-tight"
            delay={0}
          />
          <TextReveal 
            text="Notre dernière sélection en boutique."
            className="text-base md:text-lg text-theme-ink/70 font-light"
            delay={0.15}
          />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden md:block"
        >
          <Link to="/nouveautes" className="text-xs tracking-[0.2em] uppercase text-theme-ink/50 border-b border-theme-ink/20 pb-1 hover:text-theme-ink hover:border-theme-ink transition-all">
            Voir toute la sélection
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
        {featuredProducts.map((product, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 35, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.8, delay: (idx % 3) * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
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
                  {product.variant} — {product.sizes.length} tailles
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
                  Voir le produit
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
      </div>
      
      <div className="mt-12 text-center md:hidden">
        <Link to="/nouveautes" className="inline-block text-xs tracking-[0.2em] uppercase text-theme-ink/50 border-b border-theme-ink/20 pb-1 hover:text-theme-ink transition-all">
          Voir toute la sélection
        </Link>
      </div>
    </section>
  );
};

export default NewArrivals;
