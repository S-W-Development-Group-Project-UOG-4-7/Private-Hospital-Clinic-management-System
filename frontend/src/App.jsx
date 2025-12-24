import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import PrescriptionProcessingView from './pages/pharmacy/PrescriptionProcessingView';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import SupplierManagement from './pages/pharmacy/SupplierManagement';
import DrugPurchaseManagement from './pages/pharmacy/DrugPurchaseManagement';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pharmacist" element={<PharmacistDashboard />} />
      <Route path="/pharmacist/prescriptions" element={<PrescriptionProcessingView />} />
      <Route path="/pharmacist/inventory" element={<InventoryManagement />} />
      <Route path="/pharmacist/suppliers" element={<SupplierManagement />} />
      <Route path="/pharmacist/purchases" element={<DrugPurchaseManagement />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
