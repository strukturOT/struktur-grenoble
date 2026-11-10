import type { CartVariantSnapshot } from '../lib/commerce';

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  brand: string | null;
  variantName: string | null;
  imageUrl: string | null;
  priceCents: number;
  currency: string;
  quantity: number;
  availability: 'checking' | 'available' | 'unavailable';
  stockQuantity: number | null;
}

export type CartLineInput = Omit<CartLine, 'quantity' | 'availability' | 'stockQuantity'>;

export function readSavedCart(stored: string | null): CartLine[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => Boolean(line)
      && typeof line.variantId === 'string' && typeof line.productId === 'string'
      && typeof line.name === 'string' && typeof line.currency === 'string'
      && Number.isFinite(line.priceCents) && Number.isInteger(line.quantity) && line.quantity > 0)
      .map((line) => ({ ...line, availability: 'checking', stockQuantity: null }));
  } catch {
    return [];
  }
}

export function reconcileCartLines(lines: CartLine[], snapshots: CartVariantSnapshot[]): CartLine[] {
  const current = new Map(snapshots.map((snapshot) => [snapshot.variantId, snapshot]));
  return lines.map((line) => {
    const snapshot = current.get(line.variantId);
    return snapshot
      ? { ...line, ...snapshot, availability: 'available' }
      : { ...line, availability: 'unavailable', stockQuantity: 0 };
  });
}

export function cartLineProblem(line: CartLine): string | null {
  if (line.availability === 'checking') return 'Vérification du prix et du stock en cours.';
  if (line.availability === 'unavailable') return 'Cette variante n’est plus disponible. Retirez-la du panier pour continuer.';
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10) return 'Choisissez une quantité comprise entre 1 et 10 pour cet article.';
  if (!Number.isInteger(line.priceCents) || line.priceCents <= 0 || line.currency !== 'EUR') return 'Le prix de cet article est indisponible. Retirez-le du panier pour continuer.';
  if (!Number.isInteger(line.stockQuantity) || (line.stockQuantity ?? 0) < 1) return 'Cette variante est en rupture de stock. Retirez-la du panier pour continuer.';
  if (line.quantity > (line.stockQuantity ?? 0)) return `Stock disponible : ${line.stockQuantity}. Réduisez la quantité ou retirez cet article.`;
  return null;
}

export const cartCanCheckout = (lines: CartLine[]) => lines.length > 0 && lines.every((line) => !cartLineProblem(line));

export const cartContentsKey = (lines: CartLine[]) => lines.map((line) => `${line.variantId}:${line.quantity}`).join('|');
