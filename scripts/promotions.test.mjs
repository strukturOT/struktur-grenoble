import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPromotionCents, productPricing, promotionState, rowPromotion, variantPriceCents } from '../src/lib/promotions.mjs';

const now = Date.parse('2026-11-15T15:00:00Z');
const promo = (changes = {}) => ({ type: 'percentage', value: 20, enabled: true, startsAt: null, endsAt: null, ...changes });

test('a 20% promotion preserves reference prices and rounds each variant to the same cents as checkout', () => {
  const product = { priceCents: 10000, promotion: promo(), variants: [
    { id: 'small', priceCents: 9999, stockQuantity: 2, position: 0 },
    { id: 'large', priceCents: null, stockQuantity: 4, position: 1 },
  ] };
  const before = structuredClone(product);
  assert.equal(variantPriceCents(product, product.variants[0], now), 7999);
  assert.equal(variantPriceCents(product, product.variants[1], now), 8000);
  assert.deepEqual(product, before);
  assert.equal(productPricing(product, now).originalPriceCents, 9999);
  assert.equal(productPricing(product, now).hasPriceRange, true);
});

test('a fixed final price collapses variant ranges and pairs the crossed-out price with a buyable variant', () => {
  const product = { price_cents: 10000, promotion_type: 'fixed_price', promotion_value: 5000, promotion_enabled: true, product_variants: [
    { id: 'out-of-stock', price_cents: 6000, stock_quantity: 0, position: 0 },
    { id: 'available-low', price_cents: 8000, stock_quantity: 2, position: 1 },
    { id: 'available-high', price_cents: 12000, stock_quantity: 1, position: 2 },
  ] };
  const result = productPricing(product, now);
  assert.equal(result.priceCents, 5000);
  assert.equal(result.originalPriceCents, 8000);
  assert.equal(result.variant.id, 'available-low');
  assert.equal(result.hasPriceRange, false);
});

test('schedule start is inclusive and end exclusive, including timezone offsets and disabled promotions', () => {
  const promotion = promo({ startsAt: '2026-11-15T16:00:00+01:00', endsAt: '2026-11-15T17:00:00+01:00' });
  assert.equal(promotionState(promotion, now - 1), 'scheduled');
  assert.equal(applyPromotionCents(10000, promotion, now - 1), 10000);
  assert.equal(promotionState(promotion, now), 'active');
  assert.equal(applyPromotionCents(10000, promotion, now), 8000);
  assert.equal(promotionState(promotion, now + 3600000), 'expired');
  assert.equal(applyPromotionCents(10000, promotion, now + 3600000), 10000);
  assert.equal(applyPromotionCents(10000, { ...promotion, enabled: false }, now), 10000);
});

test('invalid, free, negative, excessive and malformed promotions never invent a sale price', () => {
  for (const changes of [{ value: 100 }, { value: -1 }, { value: 0 }, { value: 10.5 }, { startsAt: 'invalid' }, { endsAt: 'invalid' }, { startsAt: '2026-11-17', endsAt: '2026-11-16' }, { type: 'fixed_price', value: 12000 }, { type: 'fixed_price', value: 0 }]) {
    assert.equal(applyPromotionCents(10000, promo(changes), now), 10000);
  }
  assert.equal(applyPromotionCents(1, promo({ value: 99 }), now), 1);
  assert.equal(productPricing({ priceCents: 10000, promotion: promo({ type: 'fixed_price', value: 1 }) }, now).percentage, 99);
  assert.equal(applyPromotionCents(0, promo(), now), 0);
  assert.equal(applyPromotionCents(10000, null, now), 10000);
  assert.equal(rowPromotion({ price_cents: 10000 }), null);
});

test('a low variant price never becomes a higher promotion price and unavailable variants do not set the advertised price', () => {
  const product = { priceCents: 10000, promotion: promo({ type: 'fixed_price', value: 8000 }), variants: [
    { id: 'low', priceCents: 5000, stockQuantity: 0 },
    { id: 'available', priceCents: 10000, stockQuantity: 1 },
  ] };
  assert.equal(variantPriceCents(product, product.variants[0], now), 5000);
  assert.equal(productPricing(product, now).priceCents, 8000);
  assert.equal(productPricing(product, now).originalPriceCents, 10000);
  assert.equal(productPricing(product, now).percentage, 20);
});
