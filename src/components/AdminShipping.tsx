import { useEffect, useState, type FormEvent } from 'react';
import { Truck } from 'lucide-react';
import { useShippingSettings } from '../hooks/useShippingSettings';
import { formatMoney, saveShippingSettings } from '../lib/commerce';
import { DEFAULT_SHIPPING_LABEL, shippingSettingsFromInput } from '../../supabase/functions/_shared/shipping';

export default function AdminShipping({ refreshKey }: { refreshKey: number }) {
  const { settings, isLoading, error, refreshShippingSettings } = useShippingSettings({ refreshKey, refreshOnFocus: false });
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState(DEFAULT_SHIPPING_LABEL);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setAmount((settings.amount_cents / 100).toFixed(2));
      setLabel(settings.label);
    }
  }, [settings]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setMessage(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const current = await saveShippingSettings(shippingSettingsFromInput(amount, label));
      setAmount((current.amount_cents / 100).toFixed(2));
      setLabel(current.label);
      setSaved(true);
      setMessage('Tarif enregistré. Il s’applique aux nouveaux paiements ; les tentatives déjà réservées conservent leur montant.');
      await refreshShippingSettings();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Impossible d’enregistrer la livraison. Réessayez.');
    } finally { setIsSaving(false); }
  };

  return <section className="max-w-3xl py-4">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-struktur-orange">Ventes</p>
    <h1 className="font-display text-4xl sm:text-5xl">Livraison</h1>
    <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/55">Choisissez les frais affichés dans le panier et facturés au paiement. La livraison est proposée en France uniquement.</p>
    <div className="mt-8 flex items-center gap-4 border border-white/10 p-5"><Truck size={22} className="shrink-0 text-struktur-orange" /><div><p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Tarif actuel TTC</p><p className="mt-2 font-display text-2xl">{isLoading ? 'Chargement…' : settings ? settings.amount_cents === 0 ? 'Livraison offerte' : formatMoney(settings.amount_cents) : 'Tarif indisponible'}</p>{settings && <p className="mt-1 text-xs text-white/50">{settings.label}</p>}</div></div>
    {error && <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>}
    <form onSubmit={submit} className="mt-8 space-y-6 border-t border-white/10 pt-8">
      <label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Frais de livraison TTC (€)<input required inputMode="decimal" type="text" disabled={isSaving || isLoading} value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(null); }} placeholder="0,00" className="mt-2 block w-full max-w-sm border border-white/15 bg-transparent px-3 py-3 text-base normal-case tracking-normal outline-none focus:border-struktur-orange" /><span className="mt-2 block text-xs normal-case tracking-normal text-white/45">0 € pour une livraison offerte. Deux décimales au maximum.</span></label>
      <label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Libellé affiché<input type="text" disabled={isSaving || isLoading} value={label} onChange={(event) => { setLabel(event.target.value); setMessage(null); }} placeholder={DEFAULT_SHIPPING_LABEL} className="mt-2 block w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none focus:border-struktur-orange" /></label>
      {message && <p role={saved ? 'status' : 'alert'} className={`border p-4 text-sm leading-relaxed ${saved ? 'border-struktur-orange/30 bg-struktur-orange/5 text-white/75' : 'border-red-400/30 text-red-400'}`}>{message}</p>}
      <button type="submit" disabled={isSaving || isLoading} className="bg-struktur-orange px-6 py-4 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Enregistrement…' : 'Enregistrer le tarif'}</button>
    </form>
  </section>;
}
