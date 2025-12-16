import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError((err as Error).message || 'Unable to register right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-10 text-white space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Private Clinic</p>
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-sm text-gray-300">Register to access the system</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-400/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="first_name" className="text-sm text-gray-200">First name</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              value={form.first_name}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="John"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="last_name" className="text-sm text-gray-200">Last name</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={form.last_name}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-gray-200">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-gray-200">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="clinic.user"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="password" className="text-sm text-gray-200">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/40 outline-none transition"
              placeholder="Create a strong password"
            />
            <p className="text-xs text-gray-300">New accounts are created as patients by default.</p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-400 text-slate-900 font-semibold py-3 hover:bg-teal-300 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>

            <div className="text-center text-sm text-gray-200">
              Already signed up?{' '}
              <Link to="/" className="text-teal-200 hover:underline">
                Go to login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

