// Both values are resolved once by Vite with the same policy as generated SEO files.
export const SITE_URL: string = import.meta.env.VITE_SITE_URL;
export const SITE_IS_INDEXABLE = import.meta.env.VITE_SITE_INDEXABLE === true;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-image.webp`;
