import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, User, Mail, Lock, Building, Stethoscope } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Department {
  id: number;
  name: string;
}

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for Form Data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'patient', 
    department_id: '', 
  });

  // State for Departments
  const [departments, setDepartments] = useState<Department[]>([]);

  // 1. Fetch Departments (Fixed Type Error)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // We use <Department[]> to tell TypeScript the expected result type
        const res = await api.get<Department[]>('/admin/departments');
        
        // Ensure we set an array (handle potential undefined/null)
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching departments", err);
        // Fallback data in case of error
        setDepartments([
            { id: 1, name: 'General Medicine' },
            { id: 2, name: 'Cardiology' },
            { id: 3, name: 'Pediatrics' },
            { id: 4, name: 'Orthopedics' }
        ]);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Create the payload
    const payload: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    // Validation: Doctors need a department
    if (formData.role === 'doctor') {
      if (!formData.department_id) {
        setError("Please select a department for the doctor.");
        setLoading(false);
        return;
      }
      payload.department_id = formData.department_id;
    }

    try {
      await api.post('/admin/users', payload);
      alert('User created successfully!');
      navigate('/admin/users');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create user. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
            onClick={() => navigate('/admin/users')} 
            className="p-2 hover:bg-gray-200 rounded-full transition"
        >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <p className="text-sm text-gray-500">Create account for doctor, staff, or patient.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="e.g. John"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="e.g. Doe"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                    placeholder="john@hospital.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                    type="password" 
                    required 
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
                </div>
            </div>
          </div>

          {/* Row 3: Role & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white transition"
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

            {/* Conditional Department Dropdown (Only for Doctors) */}
            {formData.role === 'doctor' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select 
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white transition"
                    value={formData.department_id}
                    onChange={e => setFormData({...formData, department_id: e.target.value})}
                    >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Creating Account...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;