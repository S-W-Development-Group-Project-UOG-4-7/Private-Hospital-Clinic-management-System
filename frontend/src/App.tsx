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
import ReceptionistPatientRegistration from './pages/ReceptionistPatientRegistration';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import PharmacistDashboard from './pages/dashboard/PharmacistDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

// --- Pharmacy Sub-Pages ---
import PrescriptionProcessingView from './pages/pharmacy/PrescriptionProcessingView';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import SupplierManagement from './pages/pharmacy/SupplierManagement';
import DrugPurchaseManagement from './pages/pharmacy/DrugPurchaseManagement';

type ChildrenProps = { children: React.ReactNode };

const RequireAuth: React.FC<ChildrenProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  return <>{isAuthenticated ? children : <Navigate to="/login" replace />}</>;
};

const RequireRole: React.FC<ChildrenProps & { role: string }> = ({ children, role }) => {
  const raw = localStorage.getItem('authUser');
  let user: any = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

const Home: React.FC = () => (
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

const App: React.FC = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/home" element={<Home />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Protected routes */}
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
          <RequireRole role="patient">
            <PatientDashboard />
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

    <Route
      path="/receptionist"
      element={(
        <RequireAuth>
          <ReceptionistDashboard />
        </RequireAuth>
      )}
    />

    <Route
      path="/receptionist/register-patient"
      element={(
        <RequireAuth>
          <ReceptionistPatientRegistration />
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

    {/* Catch-all: Redirect unknown links to Home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
export default App;

