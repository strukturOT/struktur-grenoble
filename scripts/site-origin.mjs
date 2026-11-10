export const OFFICIAL_SITE_ORIGIN = 'https://strukturkultur.fr';
const LOCAL_SITE_ORIGIN = 'http://localhost:5173';

/** Canonical settings accept origins only, never credentials, paths or query strings. */
export function normalizeSiteOrigin(value, name = 'Site URL') {
  let url;
  try { url = new URL(value); }
  catch { throw new Error(`[seo] ${name} must be an HTTP(S) origin.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`[seo] ${name} must be an HTTP(S) origin without credentials, path, query or fragment.`);
  }
  return url.origin;
}

/** Cloudflare's configured production branch is main; every other Pages build is a preview. */
export function resolveSiteConfig(env = {}) {
  const configured = env.VITE_SITE_URL?.trim();
  const deployment = env.CF_PAGES_URL?.trim();
  const configuredOrigin = configured ? normalizeSiteOrigin(configured, 'VITE_SITE_URL') : undefined;
  const deploymentOrigin = deployment ? normalizeSiteOrigin(deployment, 'CF_PAGES_URL') : undefined;
  const branch = env.CF_PAGES_BRANCH?.trim();
  const isProduction = branch === 'main';
  const isPagesBuild = Boolean(env.CF_PAGES) || Boolean(branch) || Boolean(deployment);
  const isPreview = isPagesBuild && !isProduction;
  return {
    siteOrigin: isPreview
      ? deploymentOrigin || configuredOrigin || OFFICIAL_SITE_ORIGIN
      : configuredOrigin || (isProduction ? OFFICIAL_SITE_ORIGIN : LOCAL_SITE_ORIGIN),
    isIndexable: !isPreview && (isProduction || Boolean(configuredOrigin)),
    isPreview,
  };
}
