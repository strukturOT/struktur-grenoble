import test from 'node:test';
import assert from 'node:assert/strict';
import { canRemoveDraftVariant, confirmImportedVariants, editableVariantColor, editVariantColor, pendingProducts, variantColor } from '../src/lib/adminPending.mjs';
import { variantWriteValues } from '../src/lib/adminVariantPatch.mjs';
import { saveProductWithPhotoGuard } from '../src/lib/adminCatalog.mjs';

const variant = (attributes = {}, stockQuantity = 1) => ({ id: 'stable-variant', name: 'S', sku: 'SOURCE-S', priceCents: 6500, stockQuantity, position: 0, attributes });
const product = (id, attributes, overrides = {}) => ({ id, name: id, brand: 'NN07', status: 'draft', images: [], variants: [variant(attributes)], ...overrides });

test('queue includes unresolved earlier imports and new brands, but excludes published, archived and zero stock', () => {
  const items = [
    product('daily-2610008', { manufacturer_reference: '2610008', import_status: 'identity_review' }, { brand: 'Daily Paper' }),
    product('nn07', { source_reference: '2418240250', import_status: 'identity_review' }),
    product('published', { import_status: 'verified' }, { status: 'active' }),
    product('archived', {}, { status: 'archived' }),
    product('zero-alias', { import_status: 'identity_review' }, { variants: [variant({}, 0)] }),
  ];
  assert.deepEqual(pendingProducts(items).map(({ product }) => product.id), ['daily-2610008', 'nn07']);
  assert.deepEqual(pendingProducts(items, { query: '2610008', brand: 'Daily Paper', reason: 'color' }).map(({ product }) => product.id), ['daily-2610008']);
});

test('missing color is based on editable values, preserving legacy source colors without guessing from notes', () => {
  assert.equal(variantColor({ color: 'ECRU' }), 'ECRU');
  assert.equal(variantColor({ color: 'ECRU', colorway: '' }), '');
  const item = product('known', { colorway: 'Ivory', import_status: 'identity_review', import_notes: 'Ancienne note : coloris à confirmer.' });
  assert.equal(pendingProducts([item], { reason: 'color' }).length, 0);
  assert.equal(pendingProducts([item], { reason: 'identity' }).length, 1);
});

test('multiword color entry preserves the separator while typing and trims only for validation', () => {
  const typed = editVariantColor({ colorway: 'Dark', import_status: 'identity_review' }, 'Dark ');
  assert.equal(editableVariantColor(typed), 'Dark ');
  assert.equal(variantColor(typed), 'Dark');
  assert.equal(editableVariantColor(editVariantColor(typed, 'Dark Navy')), 'Dark Navy');
});

test('fixing metadata keeps a draft in queue until the merchant explicitly publishes', () => {
  const item = product('ready', { colorway: 'Black', import_status: 'verified' }, { images: [{ imageUrl: 'https://example.com/black.webp' }] });
  assert.deepEqual(pendingProducts([item])[0].reasons.map(({ key }) => key), ['publish']);
  assert.equal(pendingProducts([{ ...item, status: 'active' }]).length, 0);
});

test('import confirmation requires actual color, photo and explicit merchant action while normal products remain unaffected', () => {
  assert.throws(() => confirmImportedVariants([variant({ import_status: 'identity_review' })], { confirmed: true, hasPhoto: true, publish: true }), /coloris/);
  const variants = [variant({ import_status: 'media_required', colorway: 'Black' })];
  assert.throws(() => confirmImportedVariants(variants, { confirmed: true, hasPhoto: false }), /photo/);
  assert.throws(() => confirmImportedVariants(variants, { hasPhoto: true, publish: true }), /Confirmez/);
  assert.deepEqual(confirmImportedVariants([variant()], { publish: true }), [variant()]);
});

test('color correction and confirmation preserve every source field, IDs, price and stock', () => {
  const source = { source_gencode: '1002000003868', source_reference: '2418240250', source_signed_stock: 2, source_stock_components: [{ id: 'source-a', quantity: 2 }], import_status: 'verified', colorway: 'Black', import_notes: 'Source du 13 novembre.', media_verification: { identity_verified: true, source_color: 'Black' }, admin_confirmation: { confirmed_color: 'Black' } };
  const edited = editVariantColor(source, 'Navy');
  assert.equal(edited.import_status, 'identity_review');
  assert.deepEqual(edited.source_stock_components, source.source_stock_components);
  assert.equal(edited.media_verification, undefined);assert.equal(edited.admin_confirmation, undefined);
  assert.deepEqual(edited.verification_history[0].media_verification, source.media_verification);
  assert.equal(edited.import_notes_before_color_change, source.import_notes);
  assert.match(edited.import_notes, /Coloris modifié/);
  const original = variant(edited, 2);
  const [confirmed] = confirmImportedVariants([original], { confirmed: true, hasPhoto: true, confirmedAt: '2026-11-15T12:00:00Z' });
  assert.equal(confirmed.id, original.id);assert.equal(confirmed.priceCents, 6500);assert.equal(confirmed.stockQuantity, 2);
  assert.equal(confirmed.attributes.source_gencode, source.source_gencode);
  assert.equal(confirmed.attributes.source_signed_stock, 2);
  assert.equal(confirmed.attributes.import_notes_before_color_change, source.import_notes);
  assert.equal(confirmed.attributes.admin_confirmation.confirmed_color, 'Navy');
  assert.equal(confirmed.attributes.import_status, 'verified');
});

test('an intervening sale and price change survive a color-only save; an explicit inventory edit still writes', () => {
  const opened = variant({ colorway: 'Black' }, 3);
  const live = { stock_quantity: 2, price_cents: 7000, attributes: opened.attributes };
  const colorOnly = { ...opened, attributes: editVariantColor(opened.attributes, 'Navy'), preserveStockQuantity: true, preservePriceCents: true };
  const saved = { ...live, ...variantWriteValues(colorOnly, 0) };
  assert.equal(saved.stock_quantity, 2);assert.equal(saved.price_cents, 7000);assert.equal(saved.attributes.colorway, 'Navy');
  const explicit = { ...saved, ...variantWriteValues({ ...colorOnly, stockQuantity: 5, preserveStockQuantity: false }, 0) };
  assert.equal(explicit.stock_quantity, 5);assert.equal(explicit.price_cents, 7000);
});

test('persisted imported rows cannot be hidden to bypass confirmation, while unsaved rows remain removable', () => {
  const unresolved = { ...variant({ import_status: 'identity_review' }, 2), variantId: 'persisted-source-row' };
  assert.equal(canRemoveDraftVariant(unresolved), false);
  assert.equal(canRemoveDraftVariant({ ...unresolved, stockQuantity: 0 }), false);
  assert.equal(canRemoveDraftVariant({ ...unresolved, attributes: { import_status: 'verified' } }), false);
  assert.equal(canRemoveDraftVariant({ ...unresolved, variantId: undefined }), true);
  assert.throws(() => confirmImportedVariants([unresolved], { publish: true, hasPhoto: true }), /coloris/);
});

test('a draft with existing photos publishes only after all variant edits save successfully', async () => {
  let published = false;
  await assert.rejects(saveProductWithPhotoGuard(product('draft', {}, { images: [{ imageUrl: 'https://example.com/photo.webp' }] }), { status: 'active' }, null, async (input) => {
    assert.equal(input.status, 'draft');throw new Error('Variant update failed');
  }, async () => { published = true; }), /Variant update failed/);
  assert.equal(published, false);
});

test('an archived product also stays unpublished when its variant update fails', async () => {
  let published = false;
  await assert.rejects(saveProductWithPhotoGuard(product('archived', {}, { status: 'archived', images: [{ imageUrl: 'https://example.com/photo.webp' }] }), { status: 'active' }, null, async (input) => {
    assert.equal(input.status, 'draft');throw new Error('Variant update failed');
  }, async () => { published = true; }), /Variant update failed/);
  assert.equal(published, false);
});
