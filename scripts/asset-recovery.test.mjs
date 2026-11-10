import test from 'node:test';
import assert from 'node:assert/strict';
import { installAssetRecovery } from '../src/lib/assetRecovery.mjs';

function browser({ online = true, storageWorks = true } = {}) {
  const target = new EventTarget();
  const data = new Map();
  let reloads = 0;
  target.navigator = { onLine: online };
  target.location = { reload() { reloads++; } };
  target.sessionStorage = {
    getItem(key) { if (!storageWorks) throw new Error('Storage disabled'); return data.get(key) ?? null; },
    setItem(key, value) { if (!storageWorks) throw new Error('Storage disabled'); data.set(key, value); },
  };
  const error = () => {
    const event = new Event('vite:preloadError', { cancelable: true });
    target.dispatchEvent(event);
    return event;
  };
  return { target, error, get reloads() { return reloads; } };
}

test('retired assets trigger one reload and repeated errors remain bounded across page loads', () => {
  const b = browser(); let clock = 1000;
  const stop = installAssetRecovery(b.target, () => clock);
  assert.equal(b.error().defaultPrevented, true);
  assert.equal(b.reloads, 1);
  stop(); installAssetRecovery(b.target, () => clock);
  assert.equal(b.error().defaultPrevented, false);
  assert.equal(b.reloads, 1);
  clock += 60_001;
  assert.equal(b.error().defaultPrevented, true);
  assert.equal(b.reloads, 2);
});

test('offline clients and unavailable storage never enter automatic reload loops', () => {
  for (const options of [{ online: false }, { storageWorks: false }]) {
    const b = browser(options);
    installAssetRecovery(b.target);
    assert.equal(b.error().defaultPrevented, false);
    assert.equal(b.reloads, 0);
  }
});
