import { useLocation } from 'react-router-dom';
import Seo from './Seo';
import { SITE_URL } from '../lib/site';

const pages: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'STRUKTUR Grenoble | Concept store streetwear & sneakers',
    description: 'STRUKTUR Grenoble sélectionne vêtements streetwear, sneakers et accessoires premium au 45 rue Lesdiguières, Grenoble.',
  },
  '/nouveautes': {
    title: 'Nouveautés streetwear & sneakers | STRUKTUR Grenoble',
    description: 'Découvrez les dernières pièces streetwear, sneakers et accessoires disponibles chez STRUKTUR Grenoble.',
  },
  '/boutique': {
    title: 'Boutique streetwear & sneakers | STRUKTUR Grenoble',
    description: 'Achetez la sélection STRUKTUR : vêtements, sneakers et accessoires de marques indépendantes, avec stock affiché en direct.',
  },
  '/marques': {
    title: 'Marques streetwear sélectionnées | STRUKTUR Grenoble',
    description: 'Explorez les marques streetwear, outdoor et lifestyle sélectionnées par STRUKTUR au cœur de Grenoble.',
  },
  '/lookbook': {
    title: 'Lookbook streetwear Grenoble | STRUKTUR',
    description: 'Silhouettes, matières et culture urbaine : le lookbook éditorial de STRUKTUR Grenoble.',
  },
  '/le-shop': {
    title: 'Le shop STRUKTUR | 45 rue Lesdiguières, Grenoble',
    description: 'Découvrez STRUKTUR, concept store indépendant au 45 rue Lesdiguières à Grenoble : adresse, horaires et univers.',
  },
  '/journal': {
    title: 'Journal & guides produits | STRUKTUR Grenoble',
    description: 'Guides d’achat, détails, tailles et réponses utiles sur chaque pièce sélectionnée par STRUKTUR Grenoble.',
  },
};

const privatePaths = ['/admin', '/compte', '/panier', '/checkout'];

export default function RouteSeo() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/produit/') || pathname.startsWith('/categorie/') || pathname.startsWith('/journal/')) return null;

  const page = pages[pathname];
  if (page) {
    const jsonLd = pathname === '/' ? [
      {
        '@context': 'https://schema.org',
        '@type': 'ClothingStore',
        '@id': `${SITE_URL}/#store`,
        name: 'STRUKTUR Grenoble',
        url: SITE_URL,
        image: `${SITE_URL}/brand/og-image.webp`,
        telephone: '+33786380736',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '45 Rue Lesdiguières',
          postalCode: '38000',
          addressLocality: 'Grenoble',
          addressCountry: 'FR',
        },
        sameAs: ['https://www.instagram.com/struktur.kultur/'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'STRUKTUR Grenoble',
        url: SITE_URL,
        inLanguage: 'fr-FR',
      },
    ] : undefined;
    return <Seo {...page} path={pathname} jsonLd={jsonLd} />;
  }

  const noIndex = privatePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return <Seo title="STRUKTUR Grenoble" description="Concept store streetwear, sneakers et sélection premium à Grenoble." path={pathname} noIndex={noIndex} />;
}
