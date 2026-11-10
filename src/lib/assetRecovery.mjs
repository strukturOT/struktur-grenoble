/** Recover once when a deployed update retires a lazy-loaded asset. */
export function installAssetRecovery(target, now = Date.now) {
  const key = 'struktur:last-asset-reload';
  const recover = (event) => {
    if (!target.navigator.onLine) return;
    try {
      const stored = target.sessionStorage.getItem(key);
      if (stored !== null && Number.isFinite(Number(stored)) && now() - Number(stored) < 60_000) return;
      // Persistent failures, offline clients and disabled storage must not loop.
      target.sessionStorage.setItem(key, String(now()));
    } catch { return; }
    event.preventDefault();
    target.location.reload();
  };
  target.addEventListener('vite:preloadError', recover);
  return () => target.removeEventListener('vite:preloadError', recover);
}
