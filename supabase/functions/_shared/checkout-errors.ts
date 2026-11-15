/** Only these known pricing messages may pass from a PostgREST error to customers. */
export function checkoutOrderError(error: unknown): { message: string; status: 400 | 409 } | null {
  if (!error || typeof error !== 'object' || !('message' in error)) return null;
  if (error.message === 'Les prix ont changé. Actualisez le panier avant de payer.') {
    return { message: error.message, status: 409 };
  }
  if (error.message === 'Prix attendu invalide.') {
    return { message: error.message, status: 400 };
  }
  return null;
}
