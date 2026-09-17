import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Package } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { formatMoney, getCustomerOrders, type StoreOrder } from '../lib/commerce';

const Compte = () => {
  const { user, profile, isLoading, isConfigured, signIn, signOut, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  useEffect(() => { if (user) void getCustomerOrders().then(({ data }) => setOrders(data)); }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const error = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, fullName);
    if (error) { setMessage(error); return; }
    if (mode === 'signup') { setMessage('Vérifiez votre e-mail pour confirmer la création de votre compte.'); return; }
    const next = new URLSearchParams(location.search).get('next') || '/compte';
    navigate(next);
  };

  if (!isConfigured) return <div className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32 text-center"><div className="max-w-lg border border-theme-ink/10 bg-theme-surface p-8"><h1 className="text-3xl font-display">Espace client bientôt disponible.</h1><p className="mt-3 text-sm font-light leading-relaxed text-theme-ink/60">Connectez Supabase pour activer la création de compte, les adresses et l’historique des commandes.</p></div></div>;
  if (isLoading) return <div className="min-h-screen" />;

  if (!user) return <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pb-20 pt-32"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Struktur Grenoble</p><h1 className="text-5xl font-display">{mode === 'signin' ? 'Connexion' : 'Créer un compte'}</h1><p className="mt-4 font-light text-theme-ink/60">Retrouvez vos commandes et vos informations de livraison.</p><form onSubmit={handleSubmit} className="mt-10 space-y-5">{mode === 'signup' && <label className="block text-xs uppercase tracking-[0.16em] text-theme-ink/60">Nom complet<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full border border-theme-ink/20 bg-transparent px-4 py-3 text-base normal-case tracking-normal outline-none transition-colors focus:border-struktur-orange" /></label>}<label className="block text-xs uppercase tracking-[0.16em] text-theme-ink/60">E-mail<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-theme-ink/20 bg-transparent px-4 py-3 text-base normal-case tracking-normal outline-none transition-colors focus:border-struktur-orange" /></label><label className="block text-xs uppercase tracking-[0.16em] text-theme-ink/60">Mot de passe<input required minLength={8} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-theme-ink/20 bg-transparent px-4 py-3 text-base normal-case tracking-normal outline-none transition-colors focus:border-struktur-orange" /></label>{message && <p className="border border-struktur-orange/30 bg-struktur-orange/5 p-3 text-sm text-theme-ink/75">{message}</p>}<button className="w-full bg-struktur-orange py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511]">{mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</button></form><button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }} className="mt-6 text-left text-xs uppercase tracking-[0.16em] text-theme-ink/55 transition-colors hover:text-struktur-orange">{mode === 'signin' ? 'Créer un compte' : 'J’ai déjà un compte'}</button></div>;

  return <div className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-44"><div className="flex flex-col justify-between gap-6 border-b border-theme-ink/10 pb-8 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-struktur-orange">Espace client</p><h1 className="text-5xl font-display md:text-7xl">Bonjour{profile?.fullName ? `, ${profile.fullName}` : ''}.</h1><p className="mt-3 text-sm text-theme-ink/55">{user.email}</p></div><div className="flex gap-5"><Link to="/panier" className="text-xs uppercase tracking-[0.16em] text-theme-ink/60 transition-colors hover:text-struktur-orange">Panier</Link><button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-theme-ink/60 transition-colors hover:text-struktur-orange"><LogOut size={14} />Déconnexion</button></div></div><section className="mt-12"><div className="mb-6 flex items-center gap-3"><Package size={18} /><h2 className="text-3xl font-display">Mes commandes</h2></div>{orders.length ? <div className="border-t border-theme-ink/10">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-theme-ink/10 py-5 text-sm"><div><p className="font-medium">Commande #{order.orderNumber}</p><p className="mt-1 text-xs text-theme-ink/50">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</p></div><p className="text-xs uppercase tracking-[0.14em] text-theme-ink/60">{order.status.replaceAll('_', ' ')}</p><p>{formatMoney(order.totalCents, order.currency)}</p></div>)}</div> : <div className="border border-theme-ink/10 bg-theme-surface p-8"><p className="font-display text-2xl">Aucune commande pour le moment.</p><Link to="/boutique" className="mt-5 inline-block border-b border-struktur-orange pb-1 text-xs uppercase tracking-[0.16em] text-struktur-orange">Découvrir la boutique</Link></div>}</section></div>;
};

export default Compte;
