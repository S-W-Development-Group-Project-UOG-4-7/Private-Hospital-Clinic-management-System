// src/pages/admin/EditUser.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, User, Mail, Stethoscope } from 'lucide-react';
import api from '../../api/axiosConfig';

// 1. Define the User interface so TypeScript knows what data looks like
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const EditUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 2. FIX: Add <UserData[]> here to tell TypeScript expected response is an Array
        const response = await api.get<UserData[]>('/admin/users');
        
        // Now TypeScript knows response.data is an array, so .find() works
        const user = response.data.find((u) => u.id === parseInt(id || '0'));
        
        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            role: user.role, // Ensure this matches backend string (e.g. "doctor")
          });
        } else {
          setError("User not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/admin/users/${id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      navigate('/admin/users');
    } catch (err: any) {
      console.error(err);
      setError("Failed to update user. Please try again.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading user data...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
            onClick={() => navigate('/admin/users')} 
            className="p-2 hover:bg-gray-200 rounded-full transition"
        >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500">Update account details.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white" 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
                type="submit" 
                className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition flex justify-center items-center gap-2"
            >
                <Save className="w-5 h-5" /> Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;