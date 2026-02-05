import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Edit, UserPlus, 
  CheckCircle, Shield, Ban, XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

// 1. Interface matching AdminController.php output exactly
interface User {
  id: number;
  name: string;        // Backend sends "First Last" combined as 'name'
  username: string;
  email: string;
  role: string;        // Backend sends "doctor", "admin", etc.
  department: string;  // Backend sends "General Medicine" or "-"
  is_active: boolean;  // Backend sends true/false (1/0)
  created_at: string;
}

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Fetch Users Data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      
      // Cast to 'any' to safely check for Laravel's pagination structure
      const responseData = res.data as any;

      if (Array.isArray(responseData)) {
        // Direct array response
        setUsers(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        // Laravel Paginated response (data is inside .data)
        setUsers(responseData.data);
      } else {
        console.warn("Unexpected API response structure:", responseData);
        setUsers([]); 
      }
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 3. Toggle User Status
  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? "deactivate" : "activate";
    if(!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    
    try {
      await api.patch(`/admin/users/${user.id}/toggle-status`);
      fetchUsers(); // Refresh list
    } catch (error) {
      alert("Failed to update status");
    }
  };

  // 4. Helper for Badge Colors
  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'doctor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pharmacist': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'receptionist': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 5. Filter Logic
  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-lg hidden md:block">
                <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                <p className="text-gray-500 text-sm">View and manage doctors, pharmacists, and staff.</p>
            </div>
        </div>
        
        {/* --- FIXED: Button now points to /admin/users/new --- */}
        <button 
          onClick={() => navigate('/admin/users/new')} 
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search by name, email, or role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            />
            </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                <th className="p-5 border-b border-gray-200">User Details</th>
                <th className="p-5 border-b border-gray-200">Role</th>
                <th className="p-5 border-b border-gray-200">Status</th>
                <th className="p-5 border-b border-gray-200 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500 italic">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">No users found matching your search.</td></tr>
                ) : (
                filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-5">
                        <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm
                            ${user.role === 'admin' ? 'bg-purple-600' : 
                            user.role === 'doctor' ? 'bg-blue-600' : 
                            user.role === 'pharmacist' ? 'bg-orange-500' : 'bg-teal-600'}`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{user.name || 'Unknown Name'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            {user.department && user.department !== '-' && (
                                <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    • {user.department}
                                </span>
                            )}
                        </div>
                        </div>
                    </td>
                    <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                        <Shield size={12} />
                        {user.role.toUpperCase()}
                        </span>
                    </td>
                    <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${user.is_active 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {user.is_active ? <CheckCircle size={12} /> : <Ban size={12} />}
                        {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* --- EDIT BUTTON --- */}
                            <button 
                                onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit User"
                            >
                                <Edit size={18} />
                            </button>
                            
                            {/* --- TOGGLE STATUS BUTTON --- */}
                            <button 
                                onClick={() => handleToggleStatus(user)}
                                className={`p-2 rounded-lg transition-colors 
                                    ${user.is_active 
                                    ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'}`}
                                title={user.is_active ? "Deactivate User" : "Activate User"}
                            >
                                {user.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                            </button>
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;