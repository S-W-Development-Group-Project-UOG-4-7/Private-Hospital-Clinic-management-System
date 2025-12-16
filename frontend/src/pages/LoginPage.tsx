import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import type { AuthUser } from '../types/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(loginId, password);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      navigate('/portal');
    } catch (err) {
      setError((err as Error).message || 'Unable to login right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 space-y-8 text-white">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Private Hospital & Clinic Management System</p>
          <h1 className="text-3xl font-bold">Sign in to continue</h1>
          <p className="text-sm text-gray-300">Access your portal with your credentials</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-400/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="login" className="text-sm text-gray-200">Username or Email</label>
            <input
              id="login"
              name="login"
              type="text"
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="Enter your username or email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-gray-200">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-400 text-slate-900 font-semibold py-3 hover:bg-teal-300 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-200 space-y-2">
          <p>Not registered yet?</p>
          <Link to="/register" className="inline-block rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10 transition text-teal-200">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

