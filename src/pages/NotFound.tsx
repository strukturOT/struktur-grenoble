import React from 'react';
import { Link } from 'react-router-dom';
import TextReveal from '../components/TextReveal';

const NotFound = () => {
  return (
    <div className="min-h-screen pt-32 pb-24 md:pt-48 md:pb-32 px-6 md:px-12 flex flex-col items-center justify-center text-center">
      <TextReveal 
        text="404" 
        className="text-8xl md:text-[10rem] font-display font-bold tracking-tighter text-struktur-orange mb-6" 
      />
      <TextReveal 
        text="PAGE INTROUVABLE" 
        className="text-2xl md:text-4xl font-display tracking-widest uppercase mb-12" 
        delay={0.15}
      />
      <div className="mt-8">
        <Link 
          to="/"
          className="inline-block border border-white/20 px-8 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
