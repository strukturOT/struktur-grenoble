import { supabase } from './supabase';

export type LegalDocument = 'cgv' | 'mentions';
export type LegalContent = Record<LegalDocument, string>;

export const LEGAL_DOCUMENTS = {
  cgv: { key: 'legal_cgv', title: 'Conditions générales de vente', path: '/cgv' },
  mentions: { key: 'legal_mentions', title: 'Mentions légales', path: '/mentions-legales' },
} as const;

export const LEGAL_CONTENT_LIMIT = 100_000;

const parseContent = (value: unknown): string => {
  if (!value || typeof value !== 'object' || !('content' in value) || typeof value.content !== 'string') {
    throw new Error('Le contenu enregistré est illisible. Contactez l’administrateur de la boutique.');
  }
  return value.content;
};

export async function getLegalContent(): Promise<LegalContent> {
  if (!supabase) throw new Error('Les informations sont momentanément indisponibles.');
  const { data, error } = await supabase.from('site_settings').select('key, value')
    .in('key', [LEGAL_DOCUMENTS.cgv.key, LEGAL_DOCUMENTS.mentions.key]);
  if (error) throw new Error('Impossible de charger les informations légales. Réessayez.');
  const content: LegalContent = { cgv: '', mentions: '' };
  for (const row of data ?? []) {
    const document = row.key === LEGAL_DOCUMENTS.cgv.key ? 'cgv' : 'mentions';
    content[document] = parseContent(row.value);
  }
  return content;
}

export async function saveLegalContent(input: LegalContent): Promise<void> {
  if (!supabase) throw new Error('La boutique n’est pas configurée.');
  const entries = (Object.keys(LEGAL_DOCUMENTS) as LegalDocument[]).map((document) => {
    const content = input[document].trim();
    if (content.length > LEGAL_CONTENT_LIMIT) throw new Error(`Le texte « ${LEGAL_DOCUMENTS[document].title} » dépasse ${LEGAL_CONTENT_LIMIT.toLocaleString('fr-FR')} caractères.`);
    return { key: LEGAL_DOCUMENTS[document].key, value: { content }, updated_at: new Date().toISOString() };
  });
  const { error } = await supabase.from('site_settings').upsert(entries, { onConflict: 'key' });
  if (error) throw new Error('Impossible d’enregistrer les textes. Vérifiez votre accès administrateur et réessayez.');
}
