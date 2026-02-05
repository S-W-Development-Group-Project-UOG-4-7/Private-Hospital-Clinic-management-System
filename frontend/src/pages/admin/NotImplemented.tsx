import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

const NotImplemented: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 animate-fade-in">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <Construction className="w-16 h-16 text-gray-400" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Feature Coming Soon</h2>
      <p className="text-gray-500 max-w-md mb-8">
        This module is currently under development. Please check back later or contact the administrator for updates.
      </p>
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 transition"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </button>
    </div>
  );
};

export default NotImplemented;