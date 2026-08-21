// Central STRUKTUR V2 Data
// Store info, navigation, brands, products, lookbook

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

// ─── Products ────────────────────────────────────────────────

export type ProductCategory = 'sneakers' | 'vetements' | 'accessoires';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: number;
  brand: string;
  name: string;
  slug: string;
  category: ProductCategory;
  image: string;
  images?: string[];
  sizes: string[];
  colors?: ProductColor[];
  variant?: string;
  detailPath?: string;
}

export const products: Product[] = [
  {
    id: 1,
    brand: 'Saucony',
    name: 'ProGrid Omni 9',
    slug: 'saucony-omni-9',
    category: 'sneakers',
    image: strukturAssets.products.sauconyOmni9Stone,
    images: [
      strukturAssets.products.sauconyOmni9Stone,
      strukturAssets.products.sauconyOmni9Deck,
      strukturAssets.products.sauconyOmni9Display,
      strukturAssets.products.sauconyOmni9Display2,
    ],
    sizes: ['40', '41', '42', '43', '44'],
    colors: [
      { name: 'White / Lime', hex: '#C8D96F' },
      { name: 'Silver / Blue', hex: '#8FA4C8' },
      { name: 'Grey / Multi', hex: '#B0A89A' },
    ],
    variant: 'White / Lime',
    detailPath: '/produit/saucony-omni-9',
  },
  {
    id: 2,
    brand: 'Norse Projects',
    name: 'Veste workwear',
    slug: 'norse-projects-veste-workwear',
    category: 'vetements',
    image: strukturAssets.editorial.greyJacket,
    sizes: ['S', 'M', 'L', 'XL'],
    variant: 'Camel',
  },
  {
    id: 3,
    brand: 'NN07',
    name: 'Sac crossbody',
    slug: 'nn07-sac-crossbody',
    category: 'accessoires',
    image: strukturAssets.products.crossbodyTerracotta,
    sizes: ['TU'],
    variant: 'Terracotta',
  },
  {
    id: 4,
    brand: 'Wilson',
    name: 'Ensemble corduroy',
    slug: 'wilson-ensemble-corduroy',
    category: 'vetements',
    image: strukturAssets.shop.mirrorCream,
    sizes: ['M', 'L', 'XL'],
    variant: 'Cream',
  },
  {
    id: 5,
    brand: 'Hélas',
    name: 'Sweat brodé',
    slug: 'helas-sweat-brode',
    category: 'vetements',
    image: strukturAssets.editorial.blackSweater,
    sizes: ['S', 'M', 'L'],
    variant: 'Noir',
  },
  {
    id: 6,
    brand: 'OAS',
    name: 'Maille texturée',
    slug: 'oas-maille-texturee',
    category: 'vetements',
    image: strukturAssets.products.oasPatternedSet,
    sizes: ['M', 'L'],
    variant: 'Cream',
  },
  {
    id: 7,
    brand: 'New Amsterdam',
    name: 'Set urbain',
    slug: 'new-amsterdam-set-urbain',
    category: 'vetements',
    image: strukturAssets.products.denimJacket,
    sizes: ['S', 'M', 'L', 'XL'],
    variant: 'Light Blue',
  },
  {
    id: 8,
    brand: 'Gabba',
    name: 'Cardigan layered',
    slug: 'gabba-cardigan-layered',
    category: 'vetements',
    image: strukturAssets.shop.modelBlackYellow,
    sizes: ['S', 'M', 'L', 'XL'],
    variant: 'Black / Yellow',
  },
  {
    id: 9,
    brand: 'Daily Paper',
    name: 'Hoodie & chino',
    slug: 'daily-paper-hoodie-chino',
    category: 'vetements',
    image: strukturAssets.lookbook.streetGraffiti,
    sizes: ['M', 'L', 'XL'],
    variant: 'Grey / Cream',
  },
];

// ─── Lookbook ────────────────────────────────────────────────

export interface LookbookItem {
  id: number;
  image: string;
  label: string;
  location: string;
  aspect?: 'portrait' | 'landscape' | 'square';
}

export const lookbookItems: LookbookItem[] = [
  { id: 1, image: strukturAssets.home.hero, label: 'LOOK 001', location: 'GRENOBLE', aspect: 'landscape' },
  { id: 2, image: strukturAssets.moto.orangeEditorial, label: 'KULTUR 002', location: 'OFF-ROAD', aspect: 'portrait' },
  { id: 3, image: strukturAssets.editorial.alleyCamel, label: 'LOOK 003', location: 'VIEILLE VILLE', aspect: 'portrait' },
  { id: 4, image: strukturAssets.shop.foosball, label: 'KULTUR 004', location: 'IN STORE', aspect: 'portrait' },
  { id: 5, image: strukturAssets.lookbook.streetGraffiti, label: 'LOOK 005', location: 'RUE', aspect: 'portrait' },
  { id: 6, image: strukturAssets.lookbook.lifestyleScooter, label: 'KULTUR 006', location: 'GRENOBLE', aspect: 'portrait' },
  { id: 7, image: strukturAssets.editorial.rooftopTennis, label: 'KULTUR 007', location: 'ROOFTOP', aspect: 'portrait' },
  { id: 8, image: strukturAssets.shop.interiorWide2, label: 'LOOK 008', location: 'STRUKTUR', aspect: 'portrait' },
  { id: 9, image: strukturAssets.editorial.knitTerracottaBag, label: 'LOOK 009', location: 'RUE', aspect: 'portrait' },
  { id: 10, image: strukturAssets.shop.interiorWide, label: 'KULTUR 010', location: 'STRUKTUR', aspect: 'portrait' },
];
