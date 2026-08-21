import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { storeInfo } from '../data/struktur';
import { strukturAssets } from '../data/strukturAssets';
import TextReveal from '../components/TextReveal';
import ImageReveal from '../components/ImageReveal';

const LeShop = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const yFast = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div className="pt-24 md:pt-32 pb-0 min-h-screen" ref={containerRef}>
      
      {/* Hero */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-16 md:mb-24 flex flex-col md:flex-row gap-8 items-end justify-between pt-12">
        <div className="w-full md:w-1/2">
          <TextReveal text="STRUKTUR" className="text-5xl sm:text-7xl md:text-8xl font-display tracking-tight mb-2" />
          <TextReveal text="GRENOBLE." className="text-5xl sm:text-7xl md:text-8xl font-display tracking-tight text-struktur-orange" delay={0.15} />
        </div>
        <div className="w-full md:w-1/3 pb-2">
          <TextReveal 
            text="Un espace indépendant dédié à la sélection de vêtements, sneakers et accessoires premium au cœur des Alpes." 
            className="text-white/70 font-light text-lg md:text-xl" 
            delay={0.3} 
          />
        </div>
      </div>

      {/* Hero Image */}
      <div className="px-4 md:px-12 max-w-[1600px] mx-auto mb-24 md:mb-40">
        <div className="w-full aspect-[4/3] md:aspect-[21/9] relative overflow-hidden bg-struktur-light">
          <motion.div style={{ y: ySlow }} className="absolute -top-[15%] left-0 w-full h-[130%]">
            <ImageReveal src={strukturAssets.shop.interiorWide} alt="Struktur Grenoble Interior" className="w-full h-full object-cover object-center" />
          </motion.div>
        </div>
      </div>

      {/* The Space */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-24 md:mb-40">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center">
          <div className="w-full md:w-5/12 order-2 md:order-1">
            <TextReveal text="L'Espace" className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold mb-6" />
            <TextReveal text="Briques apparentes et sélection pointue." className="text-3xl md:text-5xl font-display leading-[1.1] mb-6" delay={0.1} />
            <TextReveal 
              text="Plus qu'un simple magasin, Struktur est pensé comme un lieu de vie et d'échange autour de la culture urbaine. Chaque pièce est sélectionnée pour son histoire, sa coupe et sa matière."
              className="text-white/70 font-light text-base md:text-lg mb-8"
              delay={0.2}
            />
          </div>
          <div className="w-full md:w-7/12 order-1 md:order-2">
            <div className="aspect-[3/4] md:aspect-square relative overflow-hidden bg-struktur-light">
              <motion.div style={{ y: yFast }} className="absolute -top-[10%] left-0 w-full h-[120%]">
                <ImageReveal src={strukturAssets.shop.mirrorCream} alt="Boutique Details" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* People / Kultur */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-32 md:mb-48">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="w-full md:w-1/2">
            <div className="aspect-[4/5] relative overflow-hidden bg-struktur-light mb-8 md:mb-0">
              <motion.div style={{ y: ySlow }} className="absolute -top-[10%] left-0 w-full h-[120%]">
                <ImageReveal src={strukturAssets.shop.modelBlackYellow} alt="Kultur In Store" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col justify-end md:pb-12">
            <div className="aspect-[4/5] relative overflow-hidden bg-struktur-light w-4/5 ml-auto">
              <motion.div style={{ y: yFast }} className="absolute -top-[10%] left-0 w-full h-[120%]">
                <ImageReveal src={strukturAssets.shop.modelSweatBack} alt="Kultur Details" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Info */}
      <section className="bg-struktur-light py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24">
          
          <div className="w-full md:w-1/3">
            <TextReveal text="Rendez-nous visite" className="text-4xl md:text-5xl font-display mb-8 text-struktur-dark" />
            <p className="text-struktur-dark/70 font-light mb-8">
              Passez en boutique pour découvrir les nouveautés, essayer les pièces et échanger avec l'équipe.
            </p>
            <a 
              href={storeInfo.googleReviews}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-struktur-dark/20 text-struktur-dark px-8 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-struktur-dark hover:text-white transition-colors"
            >
              Voir les avis Google
            </a>
          </div>

          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-struktur-dark/50 mb-4 border-b border-struktur-dark/10 pb-2">Adresse</h4>
              <p className="text-lg font-light text-struktur-dark mb-1">{storeInfo.address.street}</p>
              <p className="text-lg font-light text-struktur-dark/70 mb-4">{storeInfo.address.postal} {storeInfo.address.city}</p>
              <a 
                href={storeInfo.googleMaps} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-struktur-orange text-sm tracking-wide uppercase border-b border-struktur-orange pb-0.5 hover:text-struktur-dark hover:border-struktur-dark transition-colors"
              >
                Itinéraire
              </a>
            </div>

            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-struktur-dark/50 mb-4 border-b border-struktur-dark/10 pb-2">Contact</h4>
              <p className="text-lg font-light text-struktur-dark mb-4">{storeInfo.phone}</p>
              <a 
                href={storeInfo.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-struktur-orange text-sm tracking-wide uppercase border-b border-struktur-orange pb-0.5 hover:text-struktur-dark hover:border-struktur-dark transition-colors"
              >
                Instagram
              </a>
            </div>

            <div className="sm:col-span-2">
              <h4 className="text-xs tracking-[0.2em] uppercase text-struktur-dark/50 mb-4 border-b border-struktur-dark/10 pb-2">Horaires d'ouverture</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
                {storeInfo.hours.map((dayInfo, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-struktur-dark/70 font-light">{dayInfo.day}</span>
                    <span className={`font-medium ${dayInfo.hours === 'Fermé' ? 'text-struktur-orange' : 'text-struktur-dark'}`}>
                      {dayInfo.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default LeShop;
