const allowedHeaders = 'authorization, x-client-info, apikey, content-type';

function httpOrigin(value: string | undefined, originOnly = false) {
  try {
    const input = value?.trim() ?? '';
    if (/\s/.test(input)) return '';
    if (originOnly && (input.includes('\\') || !/^https?:\/\/[^/?#]+\/?$/i.test(input))) return '';
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hostname.includes('*')) return '';
    if (originOnly && (url.pathname !== '/' || url.search || url.hash)) return '';
    return url.origin;
  } catch { return ''; }
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const siteOrigin = httpOrigin(Deno.env.get('SITE_URL'));
  const allowed = new Set([siteOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']);
  for (const value of (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',')) {
    const configuredOrigin = httpOrigin(value, true);
    if (configuredOrigin) allowed.add(configuredOrigin);
  }

  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : siteOrigin,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function safeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}
