import { Component, type ReactNode } from 'react';

export default class StorefrontErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="flex min-h-screen flex-col items-center justify-center bg-theme-canvas px-6 py-20 text-center text-theme-ink">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em]">STRUKTUR Grenoble</p>
      <h1 className="max-w-xl font-display text-3xl md:text-5xl">La page n’a pas pu se charger.</h1>
      <p className="mt-5 max-w-md text-sm leading-7 text-theme-ink/65">Vérifiez votre connexion puis rechargez la page pour retrouver la boutique.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-8 min-h-12 bg-theme-ink px-7 py-3 text-sm text-theme-canvas">Recharger la page</button>
      <a href="/" className="mt-5 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Revenir à l’accueil</a>
    </main>;
  }
}
