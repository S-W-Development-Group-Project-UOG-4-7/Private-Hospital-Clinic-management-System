import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Page Imports ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalPage from './pages/PortalPage';

// --- Home Page Components ---
import HeroSection from './components/HomePage/HeroSection';
import QuickActionsBar from './components/HomePage/QuickActionsBar';
import FeaturesGrid from './components/HomePage/FeaturesGrid';
import ServicesSection from './components/HomePage/ServicesSection';
import WhyChooseUs from './components/HomePage/WhyChooseUs';
import TestimonialsSection from './components/HomePage/TestimonialsSection';
import TelemedicinePromo from './components/HomePage/TelemedicinePromo';
import Footer from './components/HomePage/Footer';

// --- Dashboard Imports ---
import AdminDashboard from './pages/dashboard/AdminDashboard'; // <--- This connects to your Admin Page
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

// --- Pharmacy Sub-Pages ---
import PrescriptionProcessingView from './pages/pharmacy/PrescriptionProcessingView';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import SupplierManagement from './pages/pharmacy/SupplierManagement';
import DrugPurchaseManagement from './pages/pharmacy/DrugPurchaseManagement';

function App() {
  // 1. Protection Wrapper: Checks if user is logged in
  const RequireAuth = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const RequireRole = ({ children, role }) => {
    const raw = localStorage.getItem('authUser');
    let user = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch (e) {
      user = null;
    }

    if (!user || user.role !== role) {
      return <Navigate to="/portal" replace />;
    }

    return children;
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
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* --- ADMIN ROUTE (The one you asked for) --- */}
      <Route
        path="/admin"
        element={(
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        )}
      />

      {/* Doctor Route */}
      <Route
        path="/doctor"
        element={(
          <RequireAuth>
            <DoctorDashboard />
          </RequireAuth>
        )}
      />

      {/* Patient Routes */}
      <Route
        path="/patient"
        element={(
          <RequireAuth>

            <RequireRole role="doctor">
              <DoctorDashboard />
            </RequireRole>

          </RequireAuth>
        )}
      />
      <Route
        path="/portal"
        element={(
          <RequireAuth>
            <PortalPage />
          </RequireAuth>
        )}
      />

      {/* Receptionist Route */}
      <Route
        path="/receptionist"
        element={(
          <RequireAuth>
            <ReceptionistDashboard />
          </RequireAuth>
        )}
      />

      {/* Pharmacist Routes */}
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

      {/* Catch-all: Redirect unknown links to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
