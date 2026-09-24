import { useEffect } from 'react';
import { DEFAULT_OG_IMAGE, SITE_URL } from '../lib/site';

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  jsonLd?: JsonLd;
}

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
};

export default function Seo({ title, description, path = '/', image, type = 'website', noIndex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
    const socialImage = image || DEFAULT_OG_IMAGE;

    document.title = title;
    upsertCanonical(canonical);
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', socialImage);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'fr_FR');
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImage);

    const id = 'struktur-page-jsonld';
    document.getElementById(id)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    }

    return () => document.getElementById(id)?.remove();
  }, [description, image, jsonLd, noIndex, path, title, type]);

  return null;
}
