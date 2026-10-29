import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { StoreProduct } from '../lib/commerce';
import { formatMoney, productImage, productPrice } from '../lib/commerce';

const ProductCard = ({ product, index = 0 }: { product: StoreProduct; index?: number }) => {
  const image = productImage(product);
  const reduceMotion = useReducedMotion();
  const colorwayCount = new Set(product.variants.map((variant) => variant.attributes.colorway).filter(Boolean)).size;
  const inStock = product.variants.some((variant) => variant.stockQuantity > 0);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px 40px 0px' }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className="product-card group min-w-0"
    >
      <Link to={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-white">
          {image ? (
            <img
              src={image}
              alt={product.images[0]?.altText || product.name}
              className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transform-none"
              loading="lazy"
              decoding="async"
              width={800}
              height={1000}
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
        <div className="px-0.5 pt-3 md:pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-theme-ink/10 pb-2 text-[9px] font-medium uppercase tracking-[0.03em] text-theme-ink/65 sm:text-[10px]">
            <span>{inStock ? 'En stock' : 'Indisponible'}</span>
            {colorwayCount > 1 && <span>{colorwayCount} coloris</span>}
          </div>
          {product.brand && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-theme-ink/65 md:text-[11px]">{product.brand}</p>}
          <h2 className="break-words font-sans text-[13px] font-semibold leading-snug tracking-[-0.015em] transition-colors group-hover:text-struktur-orange md:text-base">{product.name}</h2>
          <p className="mt-1.5 text-sm text-theme-ink md:text-base">{formatMoney(productPrice(product), product.currency)}</p>
        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
