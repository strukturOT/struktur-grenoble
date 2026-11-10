export const OFFICIAL_SITE_ORIGIN: string;
export function normalizeSiteOrigin(value: string, name?: string): string;
export function resolveSiteConfig(env?: Record<string, string | undefined>): {
  siteOrigin: string;
  isIndexable: boolean;
  isPreview: boolean;
};
