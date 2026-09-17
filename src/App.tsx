import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import RequireAdmin from './auth/RequireAdmin';

const Home = lazy(() => import('./pages/Home'));
const Nouveautes = lazy(() => import('./pages/Nouveautes'));
const LookbookPage = lazy(() => import('./pages/LookbookPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Marques = lazy(() => import('./pages/Marques'));
const LeShop = lazy(() => import('./pages/LeShop'));
const Boutique = lazy(() => import('./pages/Boutique'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Compte = lazy(() => import('./pages/Compte'));
const Panier = lazy(() => import('./pages/Panier'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-theme-canvas" />}>
      <Routes>
        <Route path="/" element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="nouveautes" element={<Nouveautes />} />
          <Route path="produit/:slug" element={<ProductDetail />} />
          <Route path="marques" element={<Marques />} />
          <Route path="lookbook" element={<LookbookPage />} />
          <Route path="boutique" element={<Boutique />} />
          <Route path="le-shop" element={<LeShop />} />
          <Route path="compte" element={<Compte />} />
          <Route path="panier" element={<Panier />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="admin" element={<RequireAdmin><Admin page="overview" /></RequireAdmin>} />
          <Route path="admin/catalogue" element={<RequireAdmin><Admin page="catalogue" /></RequireAdmin>} />
          <Route path="admin/commandes" element={<RequireAdmin><Admin page="orders" /></RequireAdmin>} />
          <Route path="admin/messages" element={<RequireAdmin><Admin page="messages" /></RequireAdmin>} />
          <Route path="admin/clients" element={<RequireAdmin><Admin page="clients" /></RequireAdmin>} />
          <Route path="admin/acces" element={<RequireAdmin><Admin page="access" /></RequireAdmin>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
