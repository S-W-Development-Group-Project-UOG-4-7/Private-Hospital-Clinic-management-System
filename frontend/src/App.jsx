import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalPage from './pages/PortalPage';
import HeroSection from './components/HomePage/HeroSection';
import QuickActionsBar from './components/HomePage/QuickActionsBar';
import FeaturesGrid from './components/HomePage/FeaturesGrid';
import ServicesSection from './components/HomePage/ServicesSection';
import WhyChooseUs from './components/HomePage/WhyChooseUs';
import TestimonialsSection from './components/HomePage/TestimonialsSection';
import TelemedicinePromo from './components/HomePage/TelemedicinePromo';
import Footer from './components/HomePage/Footer';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';
import PrescriptionProcessingView from './pages/pharmacy/PrescriptionProcessingView';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import SupplierManagement from './pages/pharmacy/SupplierManagement';
import DrugPurchaseManagement from './pages/pharmacy/DrugPurchaseManagement';

function App() {
  const RequireAuth = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const Home = () => (
    <>
      <HeroSection />
      <QuickActionsBar />
      <FeaturesGrid />
      <ServicesSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <TelemedicinePromo />
      <Footer />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/portal"
        element={(
          <RequireAuth>
            <PortalPage />
          </RequireAuth>
        )}
      />

      <Route
        path="/admin"
        element={(
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        )}
      />
      <Route
        path="/doctor"
        element={(
          <RequireAuth>
            <DoctorDashboard />
          </RequireAuth>
        )}
      />
      <Route
        path="/patient"
        element={(
          <RequireAuth>
            <PatientDashboard />
          </RequireAuth>
        )}
      />
      <Route
        path="/receptionist"
        element={(
          <RequireAuth>
            <ReceptionistDashboard />
          </RequireAuth>
        )}
      />

      <Route
        path="/pharmacist"
        element={(
          <RequireAuth>
            <PharmacistDashboard />
          </RequireAuth>
        )}
      />
      <Route
        path="/pharmacist/prescriptions"
        element={(
          <RequireAuth>
            <PrescriptionProcessingView />
          </RequireAuth>
        )}
      />
      <Route
        path="/pharmacist/inventory"
        element={(
          <RequireAuth>
            <InventoryManagement />
          </RequireAuth>
        )}
      />
      <Route
        path="/pharmacist/suppliers"
        element={(
          <RequireAuth>
            <SupplierManagement />
          </RequireAuth>
        )}
      />
      <Route
        path="/pharmacist/purchases"
        element={(
          <RequireAuth>
            <DrugPurchaseManagement />
          </RequireAuth>
        )}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
