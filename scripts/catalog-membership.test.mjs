import test from 'node:test';
import assert from 'node:assert/strict';
import { isOutletProduct, productInCategory } from '../src/lib/catalogMembership.mjs';

const outlet = { id: 'outlet-id', slug: 'outlet' };
const nn07 = { id: 'nn07-id', slug: 'nn07' };

test('Outlet membership adds a second destination without replacing brand, category or pricing', () => {
  const product = { id: 'product', isOutlet: true, category: nn07, brand: 'NN07', priceCents: 10000, promotion: { type: 'percentage', value: 20 }, variants: [{ priceCents: 10000, stockQuantity: 2 }] };
  const before = structuredClone(product);
  assert.equal(productInCategory(product, nn07), true);
  assert.equal(productInCategory(product, outlet), true);
  assert.deepEqual(product, before);
});

test('explicit removal is authoritative even for a legacy primary Outlet category', () => {
  assert.equal(isOutletProduct({ isOutlet: false, category: outlet }), false);
  assert.equal(productInCategory({ is_outlet: false, category_id: outlet.id }, outlet), false);
  assert.equal(productInCategory({ is_outlet: true, category_id: nn07.id }, outlet), true);
  assert.equal(productInCategory({ is_outlet: true, category_id: nn07.id }, nn07), true);
});

test('legacy fixtures still resolve Outlet and duplicated membership counts once', () => {
  const product = { id: 'one', is_outlet: true, category_id: outlet.id };
  assert.equal(productInCategory({ category_id: outlet.id }, outlet), true);
  assert.equal([product].filter((entry) => productInCategory(entry, outlet)).length, 1);
  assert.equal(isOutletProduct(undefined), false);
  assert.equal(productInCategory({}, null), false);
  assert.equal(productInCategory({ brand: 'Dickies' }, { id: 'dickies', slug: 'dickies' }), true);
});
