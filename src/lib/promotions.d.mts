export interface ProductPromotion {
  type: 'percentage' | 'fixed_price';
  value: number;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
}
type PriceVariant = { priceCents?: number | null; price_cents?: number | null; stockQuantity?: number; stock_quantity?: number; position?: number };
type PriceProduct<V extends PriceVariant = PriceVariant> = { priceCents?: number; price_cents?: number; promotion?: ProductPromotion | null; promotion_type?: string | null; promotion_value?: number | null; promotion_enabled?: boolean; promotion_starts_at?: string | null; promotion_ends_at?: string | null; variants?: V[]; product_variants?: V[] };
export type PromotionState = 'none' | 'inactive' | 'scheduled' | 'expired' | 'active';
export function rowPromotion(product: PriceProduct | ProductPromotion | null | undefined): ProductPromotion | null;
export function promotionState(promotion: ProductPromotion | null | undefined, now?: number | string | Date): PromotionState;
export function applyPromotionCents(baseCents: number, promotion: ProductPromotion | null | undefined, now?: number | string | Date): number;
export function variantBasePriceCents(product: PriceProduct, variant?: PriceVariant | null): number;
export function variantPriceCents(product: PriceProduct, variant?: PriceVariant | null, now?: number | string | Date): number;
export function variantPricing<V extends PriceVariant>(product: PriceProduct<V>, variant?: V | null, now?: number | string | Date): {priceCents: number; originalPriceCents: number; discounted: boolean; percentage: number; variant: V | null | undefined};
export function productPricing<V extends PriceVariant>(product: PriceProduct<V>, now?: number | string | Date): {priceCents: number; originalPriceCents: number; discounted: boolean; percentage: number; hasPriceRange: boolean; variant: V | null | undefined};
