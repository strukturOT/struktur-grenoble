import { Link } from 'react-router-dom';
import { useBrands } from '../hooks/useProducts';
import { brandHref, brandLogo } from '../lib/brands';
import StorefrontState from '../components/StorefrontState';

export default function Marques() {
  const { brands, loading, error } = useBrands();

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36 lg:px-14">
      <header className="mb-9 md:mb-12">
        <h1 className="font-display text-4xl font-medium md:text-6xl">Marques.</h1>
      </header>

      {loading ? (
        <ul aria-label="Chargement des logos de marques" aria-busy="true" className="grid grid-cols-2 gap-x-8 md:grid-cols-3 md:gap-x-10">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="flex min-h-28 animate-pulse items-center border-b border-theme-ink/15 motion-reduce:animate-none md:min-h-36" />
          ))}
        </ul>
      ) : brands.length ? (
        <ul aria-label="Marques par ordre alphabétique" className="grid grid-cols-2 gap-x-8 md:grid-cols-3 md:gap-x-10">
          {brands.map((brand) => {
            const logo = brandLogo(brand);

            return (
              <li key={brand} className="min-w-0 border-b border-theme-ink/15">
                <Link
                  to={brandHref(brand)}
                  aria-label={`${brand} — voir les produits`}
                  title={brand}
                  className="group flex min-h-28 items-center justify-start overflow-hidden py-5 pr-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-theme-ink md:min-h-36 md:py-7"
                >
                  {logo ? (
                    <span className="flex min-h-12 w-full flex-col items-start justify-center gap-1.5 md:min-h-14">
                      <img
                        src={logo.src}
                        alt={brand}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
                        style={{
                          maxWidth: `min(100%, ${logo.maxWidth}px)`,
                          maxHeight: `${logo.maxHeight}px`,
                          filter: logo.monochrome ? 'brightness(0)' : undefined,
                        }}
                      />
                      {logo.label && <span className="font-display text-sm font-semibold tracking-tight text-theme-ink sm:text-base">{brand}</span>}
                    </span>
                  ) : (
                    <span className="font-display text-2xl font-semibold tracking-tight text-theme-ink sm:text-3xl">{brand}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <StorefrontState error={error} emptyLabel="Les marques arrivent bientôt." />
      )}
    </main>
  );
}
