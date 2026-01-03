import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { register } from '../api/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    date_of_birth: '',
    phone: '',
    gender: '',
    blood_type: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [guardianForm, setGuardianForm] = useState({
    guardian_name: '',
    guardian_email: '',
    guardian_phone: '',
    guardian_relationship: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUnder18, setIsUnder18] = useState(false);

  useEffect(() => {
    document.title = 'Sign Up';

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Check if under 18
    if (name === 'date_of_birth') {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setIsUnder18(age < 18);
      } else {
        setIsUnder18(age < 18);
      }
    }
  };

  const handleGuardianChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setGuardianForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const registrationData: any = { ...form, role: 'patient' };
      
      // Include guardian info if patient is under 18
      if (isUnder18) {
        if (!guardianForm.guardian_name || !guardianForm.guardian_email || !guardianForm.guardian_phone) {
          setError('Please provide guardian information for patients under 18');
          setLoading(false);
          return;
        }
        registrationData.guardian_name = guardianForm.guardian_name;
        registrationData.guardian_email = guardianForm.guardian_email;
        registrationData.guardian_phone = guardianForm.guardian_phone;
        registrationData.guardian_relationship = guardianForm.guardian_relationship;
      }

      await register(registrationData);
      navigate('/login');
    } catch (err) {
      setError((err as Error).message || 'Unable to register right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-center bg-cover" style={{ backgroundImage: "url('/images/Hero.png')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <Navbar isScrolled={isScrolled} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">Create Account</h1>
            <p className="text-lg text-gray-200">Join our healthcare community today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 border border-gray-200 shadow-2xl bg-white/95 backdrop-blur-lg rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Sign Up</h2>
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
              <div className="px-4 py-3 mb-6 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-800">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-800">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
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
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Create a strong password"
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
                    <p className="mt-2 text-xs text-gray-600">Minimum 8 characters required</p>
                  </div>

                  <div>
                    <label htmlFor="date_of_birth" className="block mb-2 text-sm font-medium text-gray-800">Date of Birth</label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      required
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-800">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block mb-2 text-sm font-medium text-gray-800">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="blood_type" className="block mb-2 text-sm font-medium text-gray-800">Blood Type</label>
                    <select
                      id="blood_type"
                      name="blood_type"
                      value={form.blood_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Address Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-800">Street Address</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={form.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block mb-2 text-sm font-medium text-gray-800">City</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block mb-2 text-sm font-medium text-gray-800">State</label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label htmlFor="postal_code" className="block mb-2 text-sm font-medium text-gray-800">Postal Code</label>
                      <input
                        id="postal_code"
                        name="postal_code"
                        type="text"
                        value={form.postal_code}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information - Show only if under 18 */}
              {isUnder18 && (
                <div className="mb-8 p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Guardian Information</h3>
                  <p className="text-sm text-gray-700 mb-4">Since you are under 18, we require guardian information for your account.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guardian_name" className="block mb-2 text-sm font-medium text-gray-800">Guardian Name *</label>
                      <input
                        id="guardian_name"
                        name="guardian_name"
                        type="text"
                        required={isUnder18}
                        value={guardianForm.guardian_name}
                        onChange={handleGuardianChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Guardian's full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="guardian_relationship" className="block mb-2 text-sm font-medium text-gray-800">Relationship *</label>
                      <select
                        id="guardian_relationship"
                        name="guardian_relationship"
                        required={isUnder18}
                        value={guardianForm.guardian_relationship}
                        onChange={handleGuardianChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Select Relationship</option>
                        <option value="parent">Parent</option>
                        <option value="guardian">Guardian</option>
                        <option value="aunt">Aunt</option>
                        <option value="uncle">Uncle</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="guardian_email" className="block mb-2 text-sm font-medium text-gray-800">Guardian Email *</label>
                      <input
                        id="guardian_email"
                        name="guardian_email"
                        type="email"
                        required={isUnder18}
                        value={guardianForm.guardian_email}
                        onChange={handleGuardianChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Guardian's email"
                      />
                    </div>

                    <div>
                      <label htmlFor="guardian_phone" className="block mb-2 text-sm font-medium text-gray-800">Guardian Phone *</label>
                      <input
                        id="guardian_phone"
                        name="guardian_phone"
                        type="tel"
                        required={isUnder18}
                        value={guardianForm.guardian_phone}
                        onChange={handleGuardianChange}
                        className="w-full px-4 py-3 text-gray-900 transition bg-white border border-gray-300 rounded-lg shadow-sm outline-none placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        placeholder="Guardian's phone number"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-3 font-bold text-white transition duration-300 bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </motion.div>

          <div className="mt-6 text-center text-gray-200">
            <p className="mb-2">Already have an account?</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 font-bold text-white transition duration-300 bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-gray-800"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
