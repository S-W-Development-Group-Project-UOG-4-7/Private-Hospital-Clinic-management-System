import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, User, Lock, Mail, Building2, Shield } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Department {
  id: number;
  name: string;
}

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If ID exists, we are in "Edit" mode
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '', // Only required for creation
    role: 'doctor', // Default role
    department_id: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch Departments for the Dropdown
  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await api.get('/admin/departments');
        
        // FIX 1: Cast res.data to 'any' so TypeScript lets us check properties
        const responseData = res.data as any;
        
        // Handle Laravel's possible paginated response
        const data = Array.isArray(responseData) ? responseData : responseData.data; 
        setDepartments(data || []);
      } catch (err) {
        console.error("Could not load departments");
      }
    };
    fetchDeps();

    // 2. If Edit Mode, Fetch Existing User Data
    if (isEditMode) {
      const fetchUser = async () => {
        try {
          const res = await api.get(`/admin/users/${id}`); 
          
          // FIX 2: Cast to 'any' to read user properties
          const u = res.data as any;
          
          setFormData({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            password: '', // Leave blank to keep existing
            role: u.role || 'doctor', // Ensure role string matches select options
            department_id: u.department_id || '',
          });
        } catch (err) {
          setError("Failed to load user data.");
        }
      };
      
      // FIX 3: Uncomment this line so the function actually runs!
      fetchUser(); 
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        // Update Logic
        await api.put(`/admin/users/${id}`, formData);
      } else {
        // Create Logic
        await api.post('/admin/users', formData);
      }
      navigate('/admin/users'); // Go back to list on success
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save user. Check email/password requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? 'Update user details and permissions.' : 'Create a new account for a doctor, pharmacist, or staff.'}
          </p>
        </div>
        <button 
          type="button"
          onClick={() => navigate('/admin/users')}
          className="text-gray-500 hover:text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input 
                  type="text" name="first_name" required
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. John"
                  value={formData.first_name} onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                type="text" name="last_name" required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="e.g. Doe"
                value={formData.last_name} onChange={handleChange}
              />
            </div>
          </div>

          {/* Email & Role Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input 
                  type="email" name="email" required
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="doctor@clinic.com"
                  value={formData.email} onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Department & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <select 
                  name="department_id" 
                  value={formData.department_id} 
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="">Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEditMode ? 'New Password (Leave blank to keep)' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input 
                  type="password" name="password" 
                  required={!isEditMode} // Required only when creating
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
             <button 
               type="button"
               onClick={() => navigate('/admin/users')}
               className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg flex items-center gap-2 transition shadow-sm disabled:opacity-50"
             >
               {loading ? 'Saving...' : <><Save size={18} /> Save Staff Member</>}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserForm;