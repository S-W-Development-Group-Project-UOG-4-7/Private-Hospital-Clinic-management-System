import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { forgotPassword } from '../api/auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Forgot Password';
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message || 'Unable to send reset email. Please try again.');
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
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">Forgot Password?</h1>
            <p className="text-lg text-gray-200">No worries, we'll send you reset instructions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 space-y-6 border border-gray-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-2xl"
          >
            {success ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-teal-500" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="mb-6 text-gray-600">
                  We sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="mb-6 text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full px-8 py-3 font-bold text-teal-600 transition duration-300 bg-white border-2 border-teal-600 rounded-full hover:bg-teal-50"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-extrabold text-gray-900">Reset Password</h2>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 font-bold text-teal-600 transition duration-300 bg-transparent border-2 border-teal-500 rounded-full hover:bg-teal-500 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
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
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-800">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
                        className="w-full py-3 pl-10 pr-4 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-8 py-3 font-bold text-white transition duration-300 bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </motion.div>

          <div className="mt-6 text-center text-gray-200">
            <p className="mb-2">Remember your password?</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 font-bold text-white transition duration-300 bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-gray-800"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
