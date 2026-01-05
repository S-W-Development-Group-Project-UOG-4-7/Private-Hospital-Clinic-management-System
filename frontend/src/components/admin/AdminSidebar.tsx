import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItem {
  name: string;
  icon: string;
  path: string;
  badge?: number;
}

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', icon: '📊', path: '/admin' },
    { name: 'User Management', icon: '👥', path: '/admin/users' },
    { name: 'Appointments', icon: '📅', path: '/admin/appointments' },
    { name: 'Departments', icon: '🏥', path: '/admin/departments' },
    { name: 'Pharmacy', icon: '💊', path: '/admin/pharmacy' },
    { name: 'Billing', icon: '💰', path: '/admin/billing' },
    { name: 'Reports', icon: '📈', path: '/admin/reports' },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-screen z-30">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Admin Portal</h2>
        <p className="text-sm text-gray-600">Hospital Management</p>
      </div>
      
      <nav className="p-4" style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                  isActive(item.path)
                    ? 'bg-teal-500 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isActive(item.path) ? 'bg-white text-teal-500' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            navigate('/login');
          }}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors duration-200 flex items-center"
        >
          <span className="mr-3">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
