import React from 'react';
import { motion } from 'framer-motion';
import { storeInfo } from '../data/struktur';
import TextReveal from './TextReveal';

const VisitStruktur = () => {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex flex-col md:flex-row gap-12 md:gap-24">
        
        {/* Left: Intro */}
        <div className="w-full md:w-1/2">
          <TextReveal 
            text="Visit Struktur"
            className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold mb-4 md:mb-6"
            delay={0}
          />
          <TextReveal 
            text="Venez découvrir notre sélection en boutique."
            className="text-4xl md:text-5xl lg:text-6xl font-display leading-[1.1] mb-8"
            delay={0.15}
          />
          <TextReveal 
            text="Notre équipe est là pour vous conseiller et vous présenter nos dernières pièces, sneakers et accessoires en exclusivité."
            className="text-white/70 text-lg font-light max-w-md"
            delay={0.3}
          />
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-12 pt-4 md:pt-16">
          
          {/* Address */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4 border-b border-white/10 pb-2">Adresse</h4>
            <p className="text-lg font-light text-white mb-1">{storeInfo.address.street}</p>
            <p className="text-lg font-light text-white/70 mb-4">{storeInfo.address.postal} {storeInfo.address.city}</p>
            <a 
              href={storeInfo.googleMaps} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-struktur-orange text-sm tracking-wide uppercase border-b border-struktur-orange pb-0.5 hover:text-white hover:border-white transition-colors"
            >
              Itinéraire Google Maps
            </a>
          </motion.div>

          {/* Contact */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4 border-b border-white/10 pb-2">Contact</h4>
            <p className="text-lg font-light text-white mb-4">{storeInfo.phone}</p>
            <a 
              href={storeInfo.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-struktur-orange text-sm tracking-wide uppercase border-b border-struktur-orange pb-0.5 hover:text-white hover:border-white transition-colors"
            >
              Suivez-nous
            </a>
          </motion.div>

          {/* Hours */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="sm:col-span-2"
          >
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4 border-b border-white/10 pb-2">Horaires d'ouverture</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {storeInfo.hours.map((dayInfo, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="text-white/70 font-light">{dayInfo.day}</span>
                  <span className={`font-medium ${dayInfo.hours === 'Fermé' ? 'text-struktur-orange' : 'text-white'}`}>
                    {dayInfo.hours}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default VisitStruktur;
