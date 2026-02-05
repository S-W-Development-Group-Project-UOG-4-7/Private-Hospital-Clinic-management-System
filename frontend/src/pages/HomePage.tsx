import React from 'react';
import HeroSection from '../components/HomePage/HeroSection';
import FeaturesGrid from '../components/HomePage/FeaturesGrid';
import ServicesSection from '../components/HomePage/ServicesSection';
import WhyChooseUs from '../components/HomePage/WhyChooseUs';
import TelemedicinePromo from '../components/HomePage/TelemedicinePromo';
import TestimonialsSection from '../components/HomePage/TestimonialsSection';
import QuickActionsBar from '../components/HomePage/QuickActionsBar';
import Footer from '../components/HomePage/Footer';

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesGrid />
      <ServicesSection />
      <WhyChooseUs />
      <TelemedicinePromo />
      <QuickActionsBar />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default HomePage;

