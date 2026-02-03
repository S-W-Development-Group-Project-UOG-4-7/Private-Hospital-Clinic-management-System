import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalPage from './pages/PortalPage';

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

// Pharmacy Pages
import InventoryManagement from './pages/pharmacy/InventoryManagement';

// Doctor Pages
import PatientHistory from './pages/doctor/PatientHistory';

// Receptionist Pages
import ReceptionistPatientRegistration from './pages/ReceptionistPatientRegistration';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/portal" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Portal - redirects based on role */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <PortalPage />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctor/patient/:patientId/history" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientHistory />
            </ProtectedRoute>
          } />
          
          {/* Patient Routes */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/*" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          
          {/* Pharmacist Routes */}
          <Route path="/pharmacist" element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pharmacist/inventory" element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <InventoryManagement />
            </ProtectedRoute>
          } />
          
          {/* Receptionist Routes */}
          <Route path="/receptionist" element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          } />
          <Route path="/receptionist/patients/register" element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistPatientRegistration />
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
};

export default App;