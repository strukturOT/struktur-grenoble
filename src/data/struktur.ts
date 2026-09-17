// Central STRUKTUR V2 Data
// Store information, brand storytelling and lookbook content.
// Commerce inventory lives in Supabase; see src/lib/commerce.ts.

import { strukturAssets } from './strukturAssets';

// ─── Store Info ──────────────────────────────────────────────

export const storeInfo = {
  name: 'STRUKTUR',
  city: 'Grenoble',
  address: {
    street: '45 Rue Lesdiguières',
    postal: '38000',
    city: 'Grenoble',
    country: 'France',
  },
  phone: '07 86 38 07 36',
  instagram: 'https://www.instagram.com/struktur.kultur/',
  googleMaps: 'https://maps.google.com/?q=45+Rue+Lesdiguières+38000+Grenoble',
  googleReviews: 'https://share.google/j9dBTHu94QOU9o5fV',
  hours: [
    { day: 'Lundi', hours: '14h — 19h' },
    { day: 'Mardi', hours: '10h — 19h' },
    { day: 'Mercredi', hours: '10h — 19h' },
    { day: 'Jeudi', hours: '10h — 19h' },
    { day: 'Vendredi', hours: '10h — 12h / 13h30 — 19h' },
    { day: 'Samedi', hours: '10h — 19h' },
    { day: 'Dimanche', hours: 'Fermé' },
  ],
};

// ─── Navigation ──────────────────────────────────────────────

export const navigation = [
  { name: 'Nouveautés', path: '/nouveautes' },
  { name: 'Boutique', path: '/boutique' },
  { name: 'Marques', path: '/marques' },
  { name: 'Lookbook', path: '/lookbook' },
  { name: 'Le Shop', path: '/le-shop' },
];

// ─── Brands ──────────────────────────────────────────────────

export interface Brand {
  name: string;
  slug: string;
  category: string;
  featured: boolean;
  image?: string;
}

export const brands: Brand[] = [
  { name: 'Saucony', slug: 'saucony', category: 'Sneakers · Running heritage', featured: true, image: strukturAssets.products.sauconyOmni9Stone },
  { name: 'OAS', slug: 'oas', category: 'Summer textures · Sets', featured: true, image: strukturAssets.products.oasPatternedSet },
  { name: 'Norse Projects', slug: 'norse-projects', category: 'Scandinavian minimalism', featured: true, image: strukturAssets.editorial.greyJacket },
  { name: 'New Amsterdam', slug: 'new-amsterdam', category: 'Amsterdam streetwear', featured: true, image: strukturAssets.brands.newAmsterdam },
  { name: 'NN07', slug: 'nn07', category: 'Contemporary essentials', featured: false },
  { name: 'Daily Paper', slug: 'daily-paper', category: 'Culture · Streetwear', featured: false },
  { name: 'The Good People', slug: 'the-good-people', category: 'Premium casual', featured: false },
  { name: 'Gabba', slug: 'gabba', category: 'Danish workwear', featured: false },
  { name: 'Wilson', slug: 'wilson', category: 'Sport heritage', featured: false },
  { name: 'Hélas', slug: 'helas', category: 'Skate · Parisien', featured: false },
  { name: 'Arbor Antwerp', slug: 'arbor-antwerp', category: 'Maille belge', featured: false },
  { name: 'Che Studios', slug: 'che-studios', category: 'London knits', featured: false },
];

export const brandNames = brands.map((b) => b.name);

// ─── Lookbook ────────────────────────────────────────────────

export interface LookbookItem {
  id: number;
  image: string;
  label: string;
  location: string;
  aspect?: 'portrait' | 'landscape' | 'square';
}

export const lookbookItems: LookbookItem[] = [
  { id: 1, image: strukturAssets.home.hero, label: 'LOOK', location: 'GRENOBLE', aspect: 'landscape' },
  { id: 2, image: strukturAssets.moto.orangeEditorial, label: 'KULTUR', location: 'OFF-ROAD', aspect: 'portrait' },
  { id: 3, image: strukturAssets.editorial.alleyCamel, label: 'LOOK', location: 'VIEILLE VILLE', aspect: 'portrait' },
  { id: 4, image: strukturAssets.shop.foosball, label: 'KULTUR', location: 'IN STORE', aspect: 'portrait' },
  { id: 5, image: strukturAssets.lookbook.streetGraffiti, label: 'LOOK', location: 'RUE', aspect: 'portrait' },
  { id: 6, image: strukturAssets.lookbook.lifestyleScooter, label: 'KULTUR', location: 'GRENOBLE', aspect: 'portrait' },
  { id: 7, image: strukturAssets.editorial.rooftopTennis, label: 'KULTUR', location: 'ROOFTOP', aspect: 'portrait' },
  { id: 8, image: strukturAssets.shop.interiorWide2, label: 'LOOK', location: 'STRUKTUR', aspect: 'portrait' },
  { id: 9, image: strukturAssets.editorial.knitTerracottaBag, label: 'LOOK', location: 'RUE', aspect: 'portrait' },
  { id: 10, image: strukturAssets.shop.interiorWide, label: 'KULTUR', location: 'STRUKTUR', aspect: 'portrait' },
];
