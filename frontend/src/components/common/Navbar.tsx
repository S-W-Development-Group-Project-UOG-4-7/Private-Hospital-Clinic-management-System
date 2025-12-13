import React from 'react';

interface NavbarProps {
  isScrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isScrolled }) => {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className={`text-2xl font-bold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>PCMS</div>
        <div className="hidden md:flex space-x-8">
          <a href="#" className={`hover:text-teal-400 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>Home</a>
          <a href="#services" className={`hover:text-teal-400 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>Services</a>
          <a href="#about" className={`hover:text-teal-400 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>About Us</a>
          <a href="#testimonials" className={`hover:text-teal-400 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>Testimonials</a>
          <a href="#contact" className={`hover:text-teal-400 ${isScrolled ? 'text-gray-600' : 'text-white'}`}>Contact</a>
        </div>
        <button className="md:hidden text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
