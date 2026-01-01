import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../common/Navbar';

const HeroSection: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <Navbar isScrolled={isScrolled} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-4"
        >
          Advanced Healthcare, Personalized For You
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl max-w-3xl mb-8"
        >
          Experience the future of healthcare with our state-of-the-art facilities and compassionate medical professionals.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex space-x-4"
        >
          <Link 
            to="/register" 
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-full transition duration-300 inline-block"
          >
            Book Appointment
          </Link>
          <Link 
            to="/login" 
            className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:text-gray-800 transition duration-300 inline-block"
          >
            Patient Portal Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
