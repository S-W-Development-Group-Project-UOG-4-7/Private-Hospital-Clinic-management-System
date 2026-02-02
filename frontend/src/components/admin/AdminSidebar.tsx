import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Building2, 
  Package, // Changed Pill to Package for generic Inventory
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin', end: true },
    { title: 'User Management', icon: <Users size={20} />, path: '/admin/users', end: false },
    { title: 'Departments', icon: <Building2 size={20} />, path: '/admin/departments', end: false },
    { title: 'Appointments', icon: <Calendar size={20} />, path: '/admin/appointments', end: false }, 
    { title: 'Inventory', icon: <Package size={20} />, path: '/admin/inventory', end: false },
    { title: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports', end: false },
    // Placeholders
    { title: 'Billing', icon: <CreditCard size={20} />, path: '/admin/billing', end: false }, 
    { title: 'Settings', icon: <Settings size={20} />, path: '/admin/settings', end: false },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-8 border-b border-gray-100">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <span className="text-xl font-bold text-gray-800">Hospital<span className="text-teal-600">Admin</span></span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end} // Ensures /admin doesn't stay active when on /admin/users
            className={({ isActive }) =>
              `w-full flex items-center px-8 py-3 transition-all duration-200 group border-r-4 ${
                isActive
                  ? 'bg-teal-50 text-teal-700 border-teal-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`mr-3 transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
        >
          <LogOut size={20} className="mr-3 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;