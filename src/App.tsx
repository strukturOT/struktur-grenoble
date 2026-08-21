import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import Home from './pages/Home';
import Nouveautes from './pages/Nouveautes';
import LookbookPage from './pages/LookbookPage';
import ProductDetail from './pages/ProductDetail';
import Marques from './pages/Marques';
import LeShop from './pages/LeShop';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="nouveautes" element={<Nouveautes />} />
          <Route path="produit/:slug" element={<ProductDetail />} />
          <Route path="marques" element={<Marques />} />
          <Route path="lookbook" element={<LookbookPage />} />
          <Route path="le-shop" element={<LeShop />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
