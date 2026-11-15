import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { storeInfo } from '../data/struktur';
import { getLegalContent, LEGAL_DOCUMENTS, type LegalDocument } from '../lib/legalSettings';

export default function LegalPage({ document }: { document: LegalDocument }) {
  const definition = LEGAL_DOCUMENTS[document];
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setContent('');
    void getLegalContent().then((current) => {
      if (active) setContent(current[document]);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Les informations sont momentanément indisponibles.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [document, retry]);

  return <div className="mx-auto min-h-[65vh] max-w-4xl px-6 pb-24 pt-32 md:px-12 md:pb-32 md:pt-40">
    <Seo title={`${definition.title} | STRUKTUR Grenoble`} description={`${definition.title} de la boutique STRUKTUR Grenoble.`} path={definition.path} noIndex />
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-struktur-orange">STRUKTUR Grenoble</p>
    <h1 className="font-display text-4xl leading-tight sm:text-5xl">{definition.title}</h1>
    <div className="mt-10 border-t border-theme-ink/10 pt-8" aria-busy={loading}>
      {loading ? <p role="status" className="text-sm text-theme-ink/60">Chargement…</p> : error ? <div><p role="alert" className="text-sm text-theme-ink/70">{error}</p><button type="button" onClick={reload} className="mt-4 border-b border-struktur-orange pb-1 text-sm text-struktur-orange">Réessayer</button></div> : content.trim() ? <div className="space-y-6 text-sm font-light leading-7 text-theme-ink/75 md:text-base md:leading-8">{content.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="whitespace-pre-line break-words">{paragraph}</p>)}</div> : <div className="space-y-5 text-sm font-light leading-7 text-theme-ink/70"><p>Le texte de cette rubrique sera publié prochainement par la boutique.</p><p>Pour toute question, vous pouvez joindre STRUKTUR au <a href={`tel:+33${storeInfo.phone.replace(/\s/g, '').slice(1)}`} className="underline underline-offset-4 hover:text-struktur-orange">{storeInfo.phone}</a> ou vous rendre au {storeInfo.address.street}, {storeInfo.address.postal} {storeInfo.address.city}.</p></div>}
    </div>
    <Link to="/boutique" className="mt-12 inline-block border-b border-theme-ink/30 pb-1 text-xs uppercase tracking-[0.15em] hover:border-struktur-orange hover:text-struktur-orange">Retour à la boutique</Link>
  </div>;
}
