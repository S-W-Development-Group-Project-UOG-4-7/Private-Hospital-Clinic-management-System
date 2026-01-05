import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReceptionistPatientRegistration from './pages/ReceptionistPatientRegistration';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/receptionist/register-patient" element={<ReceptionistPatientRegistration />} />
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/pharmacist" element={<PharmacistDashboard />} />
      <Route path="/receptionist" element={<ReceptionistDashboard />} />
    </Routes>
  );
}

export default App;
