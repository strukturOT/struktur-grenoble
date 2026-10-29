export const brandKey = (name: string | null | undefined) =>
  (name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');

export function brandNames(rows: ReadonlyArray<{ brand: string | null }>): string[] {
  const names = new Map<string, string>();
  for (const { brand } of rows) {
    const name = brand?.normalize('NFC').trim().replace(/\s+/g, ' ');
    if (name && !names.has(brandKey(name))) names.set(brandKey(name), name);
  }
  return [...names.values()].sort(new Intl.Collator('fr', { sensitivity: 'base', numeric: true }).compare);
}

export const brandHref = (name: string) => `/boutique?marque=${encodeURIComponent(name)}`;

export type BrandLogo = {
  src: string;
  maxWidth: number;
  maxHeight: number;
  monochrome?: boolean;
  label?: boolean;
};

const brandLogoAssets: Record<string, BrandLogo> = {
  'côte&ciel': { src: '/brand/logos/cote-ciel.png', maxWidth: 270, maxHeight: 88, monochrome: true },
  'daily paper': { src: '/brand/logos/daily-paper.png', maxWidth: 300, maxHeight: 62, monochrome: true },
  dickies: { src: '/brand/logos/dickies.svg', maxWidth: 190, maxHeight: 104 },
  hélas: { src: '/brand/logos/helas.png', maxWidth: 72, maxHeight: 78, monochrome: true, label: true },
  merrell: { src: '/brand/logos/merrell.svg', maxWidth: 300, maxHeight: 58 },
  'new amsterdam surf association': { src: '/brand/logos/new-amsterdam.svg', maxWidth: 300, maxHeight: 68 },
  'pierre bassene world': { src: '/brand/logos/pierre-bassene.png', maxWidth: 190, maxHeight: 118 },
  saucony: { src: '/brand/logos/saucony.svg', maxWidth: 250, maxHeight: 64 },
  sorel: { src: '/brand/logos/sorel.svg', maxWidth: 220, maxHeight: 64 },
  'the goodpeople': { src: '/brand/logos/the-goodpeople.png', maxWidth: 300, maxHeight: 56 },
};

export const brandLogo = (name: string): BrandLogo | undefined => brandLogoAssets[brandKey(name)];
