import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/auth';

const roleCopy: Record<AuthUser['role'], { title: string; description: string }> = {
  admin: {
    title: 'Admin Portal',
    description: 'Manage the full clinic system. Detailed admin dashboards will appear here.',
  },
  doctor: {
    title: 'Doctor Portal',
    description: 'Review schedules, appointments, and patient records (UI coming soon).',
  },
  receptionist: {
    title: 'Reception Portal',
    description: 'Handle front-desk tasks, check-ins, and bookings (UI coming soon).',
  },
  pharmacist: {
    title: 'Pharmacy Portal',
    description: 'Dispense and track medications (UI coming soon).',
  },
  patient: {
    title: 'Patient Portal',
    description: 'View appointments and prescriptions (UI coming soon).',
  },
};

const PortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');

    if (!storedUser || !storedToken) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setUser(JSON.parse(storedUser) as AuthUser);
    } catch {
      setUser(null);
    }
  }, [navigate]);

  const content = useMemo(() => {
    if (!user) return null;
    return roleCopy[user.role] ?? {
      title: 'Portal',
      description: 'Role view coming soon.',
    };
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-10 text-white space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Private Hospital & Clinic Management System</p>
          <h1 className="text-3xl font-bold">{content?.title}</h1>
          <p className="text-gray-200">Welcome, {user.first_name} ({user.role}).</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-2">
          <p className="text-lg font-semibold text-teal-200">{content?.title}</p>
          <p className="text-gray-200">{content?.description}</p>
          <p className="text-sm text-gray-300">You are signed in and authorized for this role. Dedicated interfaces will be added next.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10 transition text-teal-200"
          >
            Back to login
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
              navigate('/login', { replace: true });
            }}
            className="rounded-lg bg-teal-400 text-slate-900 font-semibold px-4 py-2 hover:bg-teal-300 transition shadow-lg shadow-teal-500/30"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalPage;



