import Hero from '../components/Hero';
import NewArrivals from '../components/NewArrivals';
import { Link } from 'react-router-dom';
import { storeInfo } from '../data/struktur';

const Home = () => {
  return (
    <>
      <Hero />
      <NewArrivals />
      <section aria-labelledby="home-store-title" className="border-t border-theme-ink/10 px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto grid max-w-[1488px] gap-10 md:grid-cols-2 md:gap-20">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-struktur-orange">Le concept store</p>
            <h2 id="home-store-title" className="max-w-xl font-display text-3xl leading-tight md:text-5xl">Streetwear et sneakers au cœur de Grenoble.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-theme-ink/70">STRUKTUR réunit vêtements, sneakers et accessoires au {storeInfo.address.street}, {storeInfo.address.postal} {storeInfo.address.city}. Découvrez les collections en ligne, comparez les modèles et retrouvez les tailles disponibles sur chaque fiche.</p>
            <Link to="/le-shop" className="mt-6 inline-flex min-h-11 items-center border-b border-theme-ink/30 text-sm hover:border-struktur-orange hover:text-struktur-orange">Adresse, horaires et contact</Link>
          </div>
          <div className="md:pt-8">
            <h3 className="font-display text-2xl">Explorez la sélection</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-theme-ink/65">Des silhouettes workwear aux chaussures outdoor, retrouvez les univers de nos marques. Le prix et le stock affichés correspondent à la variante choisie.</p>
            <nav aria-label="Collections à découvrir" className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[['dickies', 'Dickies · workwear'], ['saucony', 'Saucony · sneakers'], ['daily-paper', 'Daily Paper · vêtements'], ['merrell', 'Merrell · chaussures'], ['helas', 'Hélas · vêtements'], ['cote-ciel', 'Côte&Ciel · sacs']].map(([slug, label]) => <Link key={slug} to={`/categorie/${slug}`} className="flex min-h-11 items-center border-b border-theme-ink/10 py-2 hover:border-struktur-orange hover:text-struktur-orange">{label}</Link>)}
            </nav>
            <Link to="/marques" className="mt-5 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-struktur-orange">Toutes nos marques</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
