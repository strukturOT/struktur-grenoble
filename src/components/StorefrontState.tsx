import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';

const StorefrontState = ({ error, emptyLabel = 'La sélection arrive bientôt.' }: { error?: string | null; emptyLabel?: string }) => {
  if (!isSupabaseConfigured) {
    return (
      <div className="border border-theme-ink/10 bg-theme-surface p-8 text-center md:p-12">
        <p className="font-display text-2xl">La boutique se prépare.</p>
        <p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-theme-ink/60">
          Le catalogue sera visible dès que les produits réels auront été ajoutés depuis l’administration.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-struktur-orange/40 bg-struktur-orange/5 p-8 text-center">
        <p className="font-display text-xl">Le catalogue est indisponible.</p>
        <p className="mt-2 text-sm text-theme-ink/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="border border-theme-ink/10 bg-theme-surface p-8 text-center md:p-12">
      <p className="font-display text-2xl">{emptyLabel}</p>
      <p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-theme-ink/60">
        Revenez prochainement, ou passez directement nous voir à Grenoble.
      </p>
      <Link to="/le-shop" className="mt-6 inline-block border-b border-theme-ink/30 pb-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:border-struktur-orange hover:text-struktur-orange">
        Voir le shop
      </Link>
    </div>
  );
};

export default StorefrontState;
