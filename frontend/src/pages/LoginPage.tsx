import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { login } from '../api/auth';

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
    <div className="relative min-h-screen bg-center bg-cover" style={{ backgroundImage: "url('/images/Hero.png')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <Navbar isScrolled={isScrolled} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">Welcome Back</h1>
            <p className="text-lg text-gray-200">Sign in to access your patient portal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 space-y-6 border border-gray-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Login</h2>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 font-bold text-teal-600 transition duration-300 bg-transparent border-2 border-teal-500 rounded-full hover:bg-teal-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </Link>
            </div>
            {error && (
              <div className="px-4 py-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login" className="block mb-2 text-sm font-medium text-gray-800">Email</label>
                <input
                  id="login"
                  name="login"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-800">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-500 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none"
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
                className="w-full px-8 py-3 font-bold text-white transition duration-300 bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </motion.div>

          <div className="text-center text-gray-200">
            <p className="mb-2">Don't have an account?</p>
            <Link
              to="/register"
              className="inline-block px-6 py-2 font-bold text-white transition duration-300 bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-gray-800"
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
