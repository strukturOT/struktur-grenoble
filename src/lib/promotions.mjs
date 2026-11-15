/** Product promotions leave catalogue reference prices intact. */
export function rowPromotion(product) {
  const raw = product?.promotion ?? product;
  const type = raw?.type ?? raw?.promotion_type;
  if (type !== 'percentage' && type !== 'fixed_price') return null;
  return {
    type,
    value: raw.value ?? raw.promotion_value,
    enabled: (raw.enabled ?? raw.promotion_enabled) === true,
    startsAt: raw.startsAt ?? raw.promotion_starts_at ?? null,
    endsAt: raw.endsAt ?? raw.promotion_ends_at ?? null,
  };
}

export function promotionState(promotion, now = Date.now()) {
  if (!promotion) return 'none';
  const { type, value, enabled, startsAt, endsAt } = promotion;
  if (!['percentage', 'fixed_price'].includes(type) || !Number.isInteger(value) || value <= 0 || (type === 'percentage' && value >= 100)) return 'inactive';
  if (!enabled) return 'inactive';
  const at = typeof now === 'number' ? now : new Date(now).getTime();
  const start = startsAt ? Date.parse(startsAt) : null;
  const end = endsAt ? Date.parse(endsAt) : null;
  if (!Number.isFinite(at) || (start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end)) || (start !== null && end !== null && end <= start)) return 'inactive';
  if (end !== null && at >= end) return 'expired';
  if (start !== null && at < start) return 'scheduled';
  return 'active';
}

export function applyPromotionCents(baseCents, promotion, now = Date.now()) {
  if (!Number.isInteger(baseCents) || baseCents <= 0 || promotionState(promotion, now) !== 'active') return baseCents;
  const price = promotion.type === 'percentage'
    ? Math.max(1, Math.round(baseCents * (100 - promotion.value) / 100))
    : promotion.value;
  return price > 0 && price < baseCents ? price : baseCents;
}

export function variantBasePriceCents(product, variant) {
  return variant?.priceCents ?? variant?.price_cents ?? product?.priceCents ?? product?.price_cents ?? 0;
}

export function variantPriceCents(product, variant, now = Date.now()) {
  return applyPromotionCents(variantBasePriceCents(product, variant), rowPromotion(product), now);
}

export function variantPricing(product, variant, now = Date.now()) {
  const originalPriceCents = variantBasePriceCents(product, variant);
  const priceCents = applyPromotionCents(originalPriceCents, rowPromotion(product), now);
  const discounted = priceCents > 0 && priceCents < originalPriceCents;
  return { priceCents, originalPriceCents, discounted, percentage: discounted ? Math.min(99, Math.round((originalPriceCents - priceCents) * 100 / originalPriceCents)) : 0, variant };
}

/** Pair the advertised price and reference price from the same buyable variant. */
export function productPricing(product, now = Date.now()) {
  const variants = product?.variants ?? product?.product_variants ?? [];
  const priced = variants.map((variant) => variantPricing(product, variant, now))
    .filter(({ priceCents }) => Number.isInteger(priceCents) && priceCents > 0);
  const available = priced.filter(({ variant }) => (variant.stockQuantity ?? variant.stock_quantity ?? 0) > 0);
  const choices = (available.length ? available : priced).sort((a, b) => a.priceCents - b.priceCents || a.originalPriceCents - b.originalPriceCents || (a.variant.position ?? 0) - (b.variant.position ?? 0));
  const selected = choices[0] ?? variantPricing(product, null, now);
  return { ...selected, hasPriceRange: new Set(choices.map(({ priceCents }) => priceCents)).size > 1 };
}
