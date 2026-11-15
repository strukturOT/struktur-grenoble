import { Link } from 'react-router-dom';
import { useBrands } from '../hooks/useProducts';
import { brandHref } from '../lib/brands';
import StorefrontState from '../components/StorefrontState';

export default function Marques() {
  const { brands, loading, error } = useBrands();
  const groupedBrands = new Map<string, string[]>();
  const sortedBrands = [...brands].sort(new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare);
  for (const brand of sortedBrands) {
    const letter = brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toLocaleUpperCase('fr');
    groupedBrands.set(letter, [...(groupedBrands.get(letter) || []), brand]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1200px] px-6 pb-20 pt-28 md:px-12 md:pb-28 md:pt-36">
      <header className="mb-8 md:mb-10">
        <h1 className="font-display text-4xl font-medium md:text-6xl">Marques.</h1>
      </header>

      {loading ? (
        <div role="status" aria-label="Chargement des marques" aria-busy="true" className="space-y-5">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-10 w-2/3 max-w-md animate-pulse bg-theme-ink/5 motion-reduce:animate-none" />
          ))}
        </div>
      ) : brands.length ? (
        <div aria-label="Marques par ordre alphabétique" className="space-y-6 md:space-y-8">
          {[...groupedBrands].map(([letter, names]) => (
            <section key={letter} aria-labelledby={`brands-${letter}`} className="md:grid md:grid-cols-[48px_1fr] md:gap-6">
              <h2 id={`brands-${letter}`} className="mb-2 text-sm font-medium md:pt-3 md:text-base">{letter}</h2>
              <ul className="space-y-0">
                {names.map((brand) => (
                  <li key={brand}>
                    <Link
                      to={brandHref(brand)}
                      aria-label={`${brand} — voir les produits`}
                      className="inline-flex min-h-11 max-w-full items-center break-words py-1 font-display text-3xl font-semibold leading-tight tracking-tight transition-colors hover:text-struktur-orange focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-theme-ink sm:text-4xl"
                    >
                      {brand}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <StorefrontState error={error} emptyLabel="Les marques arrivent bientôt." />
      )}
    </main>
  );
}
