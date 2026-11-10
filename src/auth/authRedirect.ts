/** Keep account return paths inside this storefront, including after email confirmation. */
export function safeAccountNext(value: string | null | undefined): string {
  if (!value) return '/compte';
  const hasControlCharacters = [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || hasControlCharacters) return '/compte';
  try {
    const base = 'https://struktur.invalid';
    const parsed = new URL(value, base);
    return parsed.origin === base && !parsed.pathname.startsWith('//') ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/compte';
  } catch { return '/compte'; }
}

export function confirmationRedirectUrl(origin: string, nextPath: string): string {
  const redirect = new URL('/compte', origin);
  const next = safeAccountNext(nextPath);
  if (next !== '/compte') redirect.searchParams.set('next', next);
  return redirect.toString();
}
