import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products } from '../data/struktur';
import TextReveal from '../components/TextReveal';

const ProductDetail = () => {
  const { slug } = useParams();
  const product = products.find(p => p.slug === slug);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // If product not found, show a simple message
  if (!product) {
    return (
      <div className="pt-32 pb-24 md:pt-48 px-6 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-display mb-4">Produit introuvable</h1>
        <Link to="/nouveautes" className="text-struktur-orange hover:text-white transition-colors uppercase tracking-widest text-sm border-b border-struktur-orange hover:border-white pb-1">
          Retour aux nouveautés
        </Link>
      </div>
    );
  }

  // Get related products (just first 3 that aren't this one)
  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 3);
  
  // Use specific images array if available, otherwise just use main image twice for demo
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image, product.image];

  return (
    <div className="pt-24 md:pt-32 pb-24 px-0 md:px-12 max-w-7xl mx-auto min-h-screen">
      
      {/* Product Main Section */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24">
        
        {/* Left: Image Gallery */}
        <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col gap-4 md:gap-6 px-6 md:px-0">
          {images.map((img, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              className="w-full bg-struktur-light"
            >
              <img src={img} alt={`${product.name} vue ${idx + 1}`} className="w-full h-auto object-cover" />
            </motion.div>
          ))}
        </div>

        {/* Right: Info Sticky Container */}
        <div className="w-full md:w-2/5 lg:w-1/3 px-6 md:px-0 relative">
          <div className="md:sticky md:top-32 flex flex-col pt-8 md:pt-0">
            
            <TextReveal 
              text={product.brand}
              className="text-xs tracking-[0.3em] uppercase text-struktur-orange font-semibold mb-2"
            />
            <TextReveal 
              text={product.name}
              className="text-3xl md:text-4xl lg:text-5xl font-display leading-[1.1] mb-4"
              delay={0.1}
            />
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm tracking-widest uppercase text-white/50 mb-10"
            >
              Disponible en boutique
            </motion.p>

            {/* Colors (if available) */}
            {product.colors && product.colors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-10"
              >
                <h4 className="text-xs tracking-[0.2em] uppercase text-white/70 mb-4">Coloris</h4>
                <div className="flex gap-4">
                  {product.colors.map((color, idx) => (
                    <button 
                      key={idx}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${idx === 0 ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sizes */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-xs tracking-[0.2em] uppercase text-white/70">Tailles</h4>
                <span className="text-[10px] text-struktur-orange uppercase tracking-wider">À confirmer en boutique</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium transition-colors border ${
                      selectedSize === size 
                        ? 'bg-white text-black border-white' 
                        : 'border-white/20 text-white hover:border-white/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button className="w-full bg-struktur-orange text-white py-5 font-medium uppercase tracking-widest text-xs sm:text-sm hover:bg-[#ff5511] transition-colors">
                Demander ma taille
              </button>
              <p className="text-center text-[10px] text-white/40 uppercase tracking-widest mt-4">
                Réservation sans obligation d'achat
              </p>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-32 pt-16 border-t border-white/10 px-6 md:px-0">
        <h3 className="text-2xl md:text-3xl font-display mb-10">Aussi disponible en boutique</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {relatedProducts.map((p) => (
            p.detailPath ? (
              <Link key={p.id} to={p.detailPath} className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-struktur-light mb-4">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-struktur-orange mb-1">{p.brand}</p>
                <p className="font-display text-lg group-hover:text-struktur-orange transition-colors">{p.name}</p>
              </Link>
            ) : (
              <Link key={p.id} to="/le-shop" className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-struktur-light mb-4">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-struktur-orange mb-1">{p.brand}</p>
                <p className="font-display text-lg group-hover:text-struktur-orange transition-colors">{p.name}</p>
              </Link>
            )
          ))}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;
