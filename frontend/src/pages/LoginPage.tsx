import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { login } from '../api/auth';
import type { AuthUser } from '../types/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Login';
    
    // Redirect if already authenticated
    const isAuthenticated = !!localStorage.getItem('authToken');
    if (isAuthenticated) {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      const role = authUser?.role?.toLowerCase() || 'patient';
      
      let redirectPath = '/portal';
      switch (role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'doctor':
          redirectPath = '/doctor';
          break;
        case 'patient':
          redirectPath = '/patient';
          break;
        case 'pharmacist':
          redirectPath = '/pharmacist';
          break;
        case 'receptionist':
          redirectPath = '/receptionist';
          break;
        default:
          redirectPath = '/portal';
      }
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Login form submitted', { loginId, password });
    
    if (!loginId || !password) {
      console.error('Missing login credentials');
      setError('Please enter both email and password');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      console.log('Making login API call...');
      const response = await login(loginId, password);
      console.log('Login response:', response);
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      
      // Route based on user role
      const userRole = response.user.role.toLowerCase();
      console.log('User role:', userRole);
      
      let redirectPath = '/portal';
      switch (userRole) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'doctor':
          redirectPath = '/doctor';
          break;
        case 'patient':
          redirectPath = '/patient';
          break;
        case 'pharmacist':
          redirectPath = '/pharmacist';
          break;
        case 'receptionist':
          redirectPath = '/receptionist';
          break;
        default:
          redirectPath = '/portal';
      }
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError((err as Error).message || 'Unable to login right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Navbar isScrolled={isScrolled} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Welcome Back</h1>
            <p className="text-lg text-gray-200">Sign in to access your patient portal</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/95 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl p-8 space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Login</h2>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white font-bold py-2 px-4 rounded-full transition duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </Link>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-800 mb-2">Email</label>
                <input
                  id="login"
                  name="login"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition shadow-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition shadow-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </motion.div>

          <div className="text-center text-gray-200">
            <p className="mb-2">Don't have an account?</p>
            <Link 
              to="/register" 
              className="inline-block bg-transparent border-2 border-white text-white font-bold py-2 px-6 rounded-full hover:bg-white hover:text-gray-800 transition duration-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

