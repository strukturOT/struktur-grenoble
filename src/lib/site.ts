export const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')).replace(/\/$/, '');
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-image.webp`;
