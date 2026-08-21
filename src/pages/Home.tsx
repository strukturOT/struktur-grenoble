import React from 'react';
import Hero from '../components/Hero';
import KulturSection from '../components/KulturSection';
import NewArrivals from '../components/NewArrivals';
import BrandsMarquee from '../components/BrandsMarquee';
import FeaturedLook from '../components/FeaturedLook';
import BoutiqueAtmosphere from '../components/BoutiqueAtmosphere';
import VisitStruktur from '../components/VisitStruktur';

const Home = () => {
  return (
    <>
      <Hero />
      <KulturSection />
      <NewArrivals />
      <BrandsMarquee />
      <FeaturedLook />
      <BoutiqueAtmosphere />
      <VisitStruktur />
    </>
  );
};

export default Home;
