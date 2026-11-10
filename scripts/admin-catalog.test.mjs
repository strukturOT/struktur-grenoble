import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAdminCatalog, hasCatalogImage, saveProductWithPhotoGuard } from '../src/lib/adminCatalog.mjs';

const products = [
  { id: 'one', name: 'Isarau', brand: 'côte&ciel', status: 'draft', images: [], variants: [{ name: 'Standard', sku: 'CC-29280', stockQuantity: 2, attributes: { manufacturer_reference: '29280', source_gencode: '1000000016932' } }] },
  { id: 'two', name: 'Veste', brand: 'Dickies', status: 'active', images: [{ imageUrl: 'https://example.com/jacket.webp' }], variants: [{ sku: 'DK-1', stockQuantity: 0, attributes: {} }] },
  { id: 'three', name: 'Archive', brand: 'Hélas', status: 'archived', images: [], variants: [{ sku: 'OLD', stockQuantity: 3, attributes: {} }] },
];

test('supplier references and barcodes are searchable with accent-insensitive brand terms', () => {
  assert.deepEqual(filterAdminCatalog(products, { query: 'Cote 29280' }).map((p) => p.id), ['one']);
  assert.deepEqual(filterAdminCatalog(products, { query: '1000000016932' }).map((p) => p.id), ['one']);
  assert.deepEqual(filterAdminCatalog(products, { query: 'missing' }), []);
});
test('publication, stock and text filters compose and clearing them restores every product', () => {
  assert.deepEqual(filterAdminCatalog(products, { status: 'draft', stock: 'available', query: 'Isarau' }).map((p) => p.id), ['one']);
  assert.deepEqual(filterAdminCatalog(products, { status: 'active', stock: 'available' }), []);
  assert.deepEqual(filterAdminCatalog(products, { stock: 'empty' }).map((p) => p.id), ['two']);
  assert.equal(filterAdminCatalog(products).length, products.length);
});
test('publication requires an actual image, including for imported drafts', () => {
  assert.equal(hasCatalogImage(products[0]), false);
  assert.equal(hasCatalogImage(products[1]), true);
  assert.equal(hasCatalogImage({ images: [{ imageUrl: ' ' }] }), false);
});
test('a failed photo upload saves no active status and never calls publication', async () => {
  let published = false;
  let savedStatus;
  await assert.rejects(saveProductWithPhotoGuard(products[0], { status: 'active' }, { name: 'photo.webp' }, async (input) => {
    savedStatus = input.status;
    throw new Error('Upload failed');
  }, async () => { published = true; }), /Upload failed/);
  assert.equal(savedStatus, 'draft');
  assert.equal(published, false);
});
test('publication follows a completed save with a photo and preserves the variant payload', async () => {
  const sequence = [];
  const input = { status: 'active', variants: [{ id: 'stable-id', attributes: { manufacturer_reference: '29280' } }] };
  await saveProductWithPhotoGuard(products[0], input, { name: 'photo.webp' }, async (saved) => {
    sequence.push(saved.status);
    assert.deepEqual(saved.variants, input.variants);
    return 'stable-product-id';
  }, async (id) => { sequence.push(id); });
  assert.deepEqual(sequence, ['draft', 'stable-product-id']);
  assert.equal(input.status, 'active');
});
