const allowedHeaders = 'authorization, x-client-info, apikey, content-type';

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const siteOrigin = (() => {
    try {
      return new URL(Deno.env.get('SITE_URL') ?? '').origin;
    } catch {
      return '';
    }
  })();
  const allowed = new Set([siteOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']);

  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : siteOrigin,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

export function safeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}
