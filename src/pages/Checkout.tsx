import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { formatMoney } from '../lib/commerce';

const Checkout = () => {
  const { lines } = useCart();
  const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 pb-24 pt-32 text-center">
      <LockKeyhole size={30} strokeWidth={1.4} className="mx-auto mb-6 text-struktur-orange" />
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Paiement sécurisé</p>
      <h1 className="mt-4 text-5xl font-display">Checkout</h1>
      <p className="mx-auto mt-5 max-w-lg font-light leading-relaxed text-theme-ink/65">Votre panier est prêt ({formatMoney(total, lines[0]?.currency || 'EUR')}). Le paiement ne sera activé qu’après le choix et la configuration du prestataire de paiement : aucune commande ou carte bancaire n’est traitée par ce site pour le moment.</p>
      <Link to="/panier" className="mx-auto mt-8 border-b border-theme-ink/30 pb-1 text-xs uppercase tracking-[0.18em] text-theme-ink/60 transition-colors hover:border-struktur-orange hover:text-struktur-orange">Retour au panier</Link>
    </div>
  );
};

export default Checkout;
