import React from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storeInfo, navigation } from '../data/struktur';
import { Logo } from './Logo';

const Footer = () => {
  return (
    <footer className="bg-theme-canvas pt-24 pb-12 px-6 md:px-12 border-t border-theme-ink/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Logo variant="wordmark" className="h-8 text-theme-ink mb-6" />
          <p className="text-theme-ink/70 max-w-sm mb-8 font-light">
            Streetwear, sneakers & sélection premium au cœur de Grenoble. Un espace indépendant dédié à la culture urbaine.
          </p>
          <div className="flex gap-4">
            <a href={storeInfo.instagram} target="_blank" rel="noopener noreferrer" className="p-3 border border-theme-ink/10 rounded-full hover:border-struktur-orange hover:text-struktur-orange transition-colors">
              <Camera size={20} />
            </a>
            <a href={storeInfo.googleMaps} target="_blank" rel="noopener noreferrer" className="p-3 border border-theme-ink/10 rounded-full hover:border-struktur-orange hover:text-struktur-orange transition-colors">
              <MapPin size={20} />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h4 className="font-display text-lg mb-6 uppercase tracking-widest">Navigation</h4>
          <div className="flex flex-col space-y-3">
            {navigation.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className="text-theme-ink/70 hover:text-theme-ink transition-colors w-fit"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h4 className="font-display text-lg mb-6 uppercase tracking-widest">Nous trouver</h4>
          <p className="text-theme-ink/70 mb-2">{storeInfo.address.street}</p>
          <p className="text-theme-ink/70 mb-6">{storeInfo.address.postal} {storeInfo.address.city}</p>
          <a href={storeInfo.googleMaps} target="_blank" rel="noopener noreferrer" className="text-sm text-struktur-orange uppercase tracking-widest hover:text-theme-ink transition-colors inline-block pb-1 border-b border-struktur-orange/30 hover:border-theme-ink">
            Itinéraire
          </a>
        </motion.div>
      </div>

      <motion.div 
        className="max-w-7xl mx-auto pt-8 border-t border-theme-ink/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-theme-ink/50 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p>&copy; {new Date().getFullYear()} STRUKTUR GRENOBLE. TOUS DROITS RÉSERVÉS.</p>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-theme-ink transition-colors">Accueil</Link>
          <Link to="/boutique" className="hover:text-theme-ink transition-colors">La Boutique</Link>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
