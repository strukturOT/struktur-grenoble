import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { StoreProduct } from '../lib/commerce';
import { formatMoney, productImage, productPrice } from '../lib/commerce';

const ProductCard = ({ product, index = 0 }: { product: StoreProduct; index?: number }) => {
  const image = productImage(product);
  const colorwayCount = new Set(product.variants.map((variant) => variant.attributes.colorway).filter(Boolean)).size;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-6%' }}
      transition={{ duration: 0.75, delay: (index % 3) * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group"
    >
      <Link to={`/produit/${product.slug}`} className="block">
        <div className="relative mb-5 aspect-[4/5] overflow-hidden bg-theme-surface">
          {image ? (
            <img
              src={image}
              alt={product.images[0]?.altText || product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-end bg-theme-surface p-5 text-[10px] uppercase tracking-[0.22em] text-theme-ink/35">
              Visuel à venir
            </div>
          )}
          <div className="absolute inset-0 hidden items-center justify-center bg-black/35 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:flex">
            <span className="translate-y-5 bg-white px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-black transition-transform duration-500 group-hover:translate-y-0 group-hover:bg-struktur-orange group-hover:text-white">
              Voir le produit
            </span>
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.brand && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-struktur-orange">{product.brand}</p>}
            <h2 className="text-xl font-display leading-tight transition-colors duration-300 group-hover:text-struktur-orange md:text-2xl">{product.name}</h2>
            {colorwayCount > 1 && <p className="mt-1 text-xs text-theme-ink/50">{colorwayCount} coloris</p>}
          </div>
          <p className="shrink-0 pt-1 text-sm text-theme-ink/65">{formatMoney(productPrice(product), product.currency)}</p>
        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
