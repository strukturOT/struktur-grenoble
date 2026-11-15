import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getLegalContent, LEGAL_CONTENT_LIMIT, LEGAL_DOCUMENTS, saveLegalContent, type LegalContent, type LegalDocument } from '../lib/legalSettings';

export default function AdminLegal({ refreshKey }: { refreshKey: number }) {
  const [content, setContent] = useState<LegalContent>({ cgv: '', mentions: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    setSaved(false);
    void getLegalContent().then((current) => { if (active) setContent(current); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : 'Impossible de charger les textes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey, retry]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || loading || error) return;
    setSaving(true);
    setMessage(null);
    setSaved(false);
    try {
      await saveLegalContent(content);
      setContent((current) => ({ cgv: current.cgv.trim(), mentions: current.mentions.trim() }));
      setSaved(true);
      setMessage('Textes enregistrés. Les rubriques du site affichent maintenant votre contenu.');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Impossible d’enregistrer les textes. Réessayez.');
    } finally { setSaving(false); }
  };

  return <section className="max-w-4xl py-4">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-struktur-orange">Informations de la boutique</p>
    <h1 className="font-display text-4xl sm:text-5xl">Informations légales</h1>
    <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-white/55">Ajoutez les textes rédigés pour la boutique. L’enregistrement les publie dans les rubriques CGV et Mentions légales accessibles en bas du site. Le texte est affiché tel quel, avec vos paragraphes.</p>
    {loading && <p role="status" className="mt-6 text-sm text-white/60">Chargement des textes…</p>}
    {error && <div className="mt-6 border border-red-400/30 p-4"><p role="alert" className="text-sm text-red-400">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 border-b border-struktur-orange text-sm text-struktur-orange">Réessayer</button></div>}
    <form onSubmit={submit} className="mt-8 space-y-8">
      {(Object.keys(LEGAL_DOCUMENTS) as LegalDocument[]).map((document) => {
        const definition = LEGAL_DOCUMENTS[document];
        return <div key={document} className="border-t border-white/10 pt-7"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><label htmlFor={`legal-${document}`} className="text-xs font-medium uppercase tracking-[0.06em] text-white/70">{definition.title}</label><Link to={definition.path} target="_blank" rel="noopener noreferrer" className="text-xs text-struktur-orange underline underline-offset-4">Voir la rubrique</Link></div><textarea id={`legal-${document}`} value={content[document]} disabled={loading || saving || Boolean(error)} maxLength={LEGAL_CONTENT_LIMIT} rows={14} onChange={(event) => { setContent((current) => ({ ...current, [document]: event.target.value })); setMessage(null); }} placeholder="Collez ici le texte rédigé pour la boutique…" className="w-full resize-y border border-white/15 bg-transparent px-4 py-3 text-sm leading-7 outline-none placeholder:text-white/30 focus:border-struktur-orange disabled:opacity-50" /><p className="mt-2 text-xs leading-6 text-white/45">{content[document].trim() ? `${content[document].length.toLocaleString('fr-FR')} caractères` : 'Rubrique en attente de texte. Le site affiche une indication de publication prochaine.'}</p></div>;
      })}
      {message && <p role={saved ? 'status' : 'alert'} className={`border p-4 text-sm leading-7 ${saved ? 'border-struktur-orange/30 bg-struktur-orange/5 text-white/75' : 'border-red-400/30 text-red-400'}`}>{message}</p>}
      <button type="submit" disabled={loading || saving || Boolean(error)} className="bg-struktur-orange px-6 py-4 text-xs font-medium uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer et publier les textes'}</button>
    </form>
  </section>;
}
