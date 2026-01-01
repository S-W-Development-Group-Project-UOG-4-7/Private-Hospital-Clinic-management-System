import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  isScrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isScrolled }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in
  const isAuthenticated = !!localStorage.getItem('authToken');
  const authUser = isAuthenticated ? JSON.parse(localStorage.getItem('authUser') || '{}') : null;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!authUser?.role) return '/portal';
    const role = authUser.role.toLowerCase();
    switch (role) {
      case 'admin': return '/admin';
      case 'doctor': return '/doctor';
      case 'patient': return '/patient';
      case 'pharmacist': return '/pharmacist';
      case 'receptionist': return '/receptionist';
      default: return '/portal';
    }
  };

  const dashboardPath = getDashboardPath();
  const isOnDashboard = location.pathname === dashboardPath || 
                        location.pathname.startsWith('/admin') ||
                        location.pathname.startsWith('/doctor') ||
                        location.pathname.startsWith('/patient') ||
                        location.pathname.startsWith('/pharmacist') ||
                        location.pathname.startsWith('/receptionist') ||
                        location.pathname === '/portal';
  
  // Don't render navbar on dashboard pages
  if (isOnDashboard) {
    return null;
  }
  
  const shouldShowBackground = isScrolled;
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${shouldShowBackground ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className={`text-2xl font-bold ${shouldShowBackground ? 'text-gray-800' : 'text-white'}`}>PCMS</div>
        <div className="hidden md:flex space-x-8">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
          >
            Home
          </a>
          <a 
            href="#services" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('services');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
          >
            Services
          </a>
          <a 
            href="#about" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('about');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
          >
            About Us
          </a>
          <a 
            href="#testimonials" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('testimonials');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
          >
            Testimonials
          </a>
          <a 
            href="#contact" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('contact');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
          >
            Contact
          </a>
        </div>
        <div className="hidden md:flex space-x-4">
          {isAuthenticated ? (
            <>
              {!isOnDashboard && (
              <Link 
                  to={dashboardPath}
                  className={`px-6 py-3 rounded-full transition duration-300 border-2 ${shouldShowBackground ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' : 'border-white text-white hover:bg-white hover:text-gray-800'}`}
              >
                Dashboard
              </Link>
              )}
              <button
                onClick={handleLogout}
                className={`px-6 py-3 rounded-full transition duration-300 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`px-6 py-3 rounded-full transition duration-300 ${isScrolled ? 'text-green-600 border border-green-600 hover:bg-green-600 hover:text-white' : 'text-white border border-white hover:bg-white hover:text-gray-800'}`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`px-6 py-3 rounded-full transition duration-300 border-2 ${isScrolled ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' : 'border-white text-white hover:bg-white hover:text-gray-800'}`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
        <button 
          onClick={toggleMobileMenu}
          className={`md:hidden ${shouldShowBackground ? 'text-gray-800' : 'text-white'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${shouldShowBackground ? 'bg-white' : 'bg-gray-900'} border-t ${shouldShowBackground ? 'border-gray-200' : 'border-gray-700'}`}>
          <div className="container mx-auto px-6 py-4 space-y-4">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`block transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
            >
              Home
            </a>
            <a 
              href="#services" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const element = document.getElementById('services');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
            >
              Services
            </a>
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const element = document.getElementById('about');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
            >
              About Us
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const element = document.getElementById('testimonials');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
            >
              Testimonials
            </a>
            <a 
              href="#contact" 
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                const element = document.getElementById('contact');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block transition duration-300 ${shouldShowBackground ? 'text-gray-600 hover:text-green-600' : 'text-white hover:text-green-400'}`}
            >
              Contact
            </a>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  {!isOnDashboard && (
                  <Link 
                      to={dashboardPath}
                      className={`px-6 py-3 rounded-full text-center transition duration-300 border-2 ${isScrolled ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' : 'border-white text-white hover:bg-white hover:text-gray-800'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`px-6 py-3 rounded-full text-center transition duration-300 border-2 ${isScrolled ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`px-6 py-3 rounded-full text-center transition duration-300 ${isScrolled ? 'text-green-600 border border-green-600 hover:bg-green-600 hover:text-white' : 'text-white border border-white hover:bg-white hover:text-gray-800'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className={`px-6 py-3 rounded-full text-center transition duration-300 border-2 ${isScrolled ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' : 'border-white text-white hover:bg-white hover:text-gray-800'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
