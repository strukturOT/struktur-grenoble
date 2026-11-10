import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { CartProvider } from './cart/CartProvider.tsx'
import StorefrontErrorBoundary from './components/StorefrontErrorBoundary.tsx'
import { installAssetRecovery } from './lib/assetRecovery.mjs'

installAssetRecovery(window)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorefrontErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
    </StorefrontErrorBoundary>
  </StrictMode>,
)
