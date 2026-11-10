import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSiteOrigin, resolveSiteConfig } from './site-origin.mjs';

const official = 'https://strukturkultur.fr';
const deployment = 'https://preview.struktur-grenoble.pages.dev';
const matrix = [
  ['Pages main defaults to the official production origin',
    { CF_PAGES: '1', CF_PAGES_BRANCH: 'main', CF_PAGES_URL: deployment }, official, true, false],
  ['Pages main supports an explicit origin override',
    { CF_PAGES_BRANCH: 'main', VITE_SITE_URL: 'https://owned.example/' }, 'https://owned.example', true, false],
  ['Preview ignores inherited indexing permission and uses its deployment origin',
    { CF_PAGES: '1', CF_PAGES_BRANCH: 'feature/shop', CF_PAGES_URL: deployment, VITE_SITE_URL: official }, deployment, false, true],
  ['A non-main branch remains a preview without the CF_PAGES flag',
    { CF_PAGES_BRANCH: 'preview', CF_PAGES_URL: deployment, VITE_SITE_URL: official }, deployment, false, true],
  ['An unidentified Pages branch fails closed to noindex',
    { CF_PAGES: '1', VITE_SITE_URL: official }, official, false, true],
  ['A Pages deployment URL alone cannot enable indexing',
    { CF_PAGES_URL: deployment, VITE_SITE_URL: official }, deployment, false, true],
  ['Local defaults remain noindex', {}, 'http://localhost:5173', false, false],
  ['An explicit local canonical can enable production-output verification',
    { VITE_SITE_URL: official }, official, true, false],
];
for (const [name, env, siteOrigin, isIndexable, isPreview] of matrix) {
  test(name, () => assert.deepEqual(resolveSiteConfig(env), { siteOrigin, isIndexable, isPreview }));
}
test('HTTP(S) origins normalize consistently', () => {
  assert.equal(normalizeSiteOrigin('HTTPS://STRUKTURKULTUR.FR/'), official);
  assert.equal(normalizeSiteOrigin('http://localhost:5173/'), 'http://localhost:5173');
});
test('Invalid origins fail before producing canonicals', () => {
  for (const value of ['not-a-url', 'ftp://example.com', 'https://example.com/path', 'https://user:password@example.com', 'https://example.com/?preview=1', 'https://example.com/#section']) {
    assert.throws(() => resolveSiteConfig({ VITE_SITE_URL: value }));
  }
  assert.throws(() => resolveSiteConfig({ CF_PAGES_BRANCH: 'preview', CF_PAGES_URL: 'https://example.com/path' }));
});
