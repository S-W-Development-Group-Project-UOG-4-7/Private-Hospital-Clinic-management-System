import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Page Imports ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalPage from './pages/PortalPage';

// --- Admin Sub-Pages ---
import UsersList from './pages/admin/UsersList';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import Inventory from './pages/admin/Inventory';
import Reports from './pages/admin/Reports';
import Departments from './pages/admin/Departments';
import Appointments from './pages/admin/Appointments'; // <--- NEW IMPORT ADDED HERE
import NotImplemented from './pages/admin/NotImplemented';

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

  const userRole = user?.role?.toLowerCase();
  const requiredRole = role.toLowerCase();

  if (!user || userRole !== requiredRole) {
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

    {/* --- ADMIN ROUTES --- */}
    <Route
      path="/admin"
      element={(
        <RequireAuth>
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        </RequireAuth>
      )}
    >
        {/* Working Pages */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/new" element={<CreateUser />} />
        <Route path="users/:id/edit" element={<EditUser />} />
        
        <Route path="reports" element={<Reports />} />
        <Route path="inventory" element={<Inventory />} />
        
        {/* Connected Pages */}
        <Route path="departments" element={<Departments />} />
        <Route path="appointments" element={<Appointments />} /> {/* <--- UPDATED THIS LINE */}

        {/* Placeholders for Future Features */}
        <Route path="billing" element={<NotImplemented />} />
        <Route path="settings" element={<NotImplemented />} />
    </Route>

    {/* --- DOCTOR ROUTES --- */}
    <Route
      path="/doctor/*"
      element={(
        <RequireAuth>
          <RequireRole role="doctor">
            <DoctorDashboard />
          </RequireRole>
        </RequireAuth>
      )}
    />

    {/* --- PATIENT ROUTES --- */}
    <Route
      path="/patient/*"
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

    {/* --- RECEPTIONIST ROUTES --- */}
    <Route
      path="/receptionist/*"
      element={(
        <RequireAuth>
          <RequireRole role="receptionist">
            <ReceptionistDashboard />
          </RequireRole>
        </RequireAuth>
      )}
    />

    <Route
      path="/receptionist/register-patient"
      element={(
        <RequireAuth>
          <RequireRole role="receptionist">
            <ReceptionistPatientRegistration />
          </RequireRole>
        </RequireAuth>
      )}
    />

    {/* --- PHARMACIST ROUTES --- */}
    <Route
      path="/pharmacist/*"
      element={(
        <RequireAuth>
          <RequireRole role="pharmacist">
            <PharmacistDashboard />
          </RequireRole>
        </RequireAuth>
      )}
    />

    {/* Pharmacist Sub-routes */}
    <Route
      path="/pharmacist/prescriptions"
      element={(
        <RequireAuth>
          <RequireRole role="pharmacist">
            <PrescriptionProcessingView />
          </RequireRole>
        </RequireAuth>
      )}
    />

    <Route
      path="/pharmacist/inventory"
      element={(
        <RequireAuth>
          <RequireRole role="pharmacist">
            <InventoryManagement />
          </RequireRole>
        </RequireAuth>
      )}
    />

    <Route
      path="/pharmacist/suppliers"
      element={(
        <RequireAuth>
          <RequireRole role="pharmacist">
            <SupplierManagement />
          </RequireRole>
        </RequireAuth>
      )}
    />

    <Route
      path="/pharmacist/purchases"
      element={(
        <RequireAuth>
          <RequireRole role="pharmacist">
            <DrugPurchaseManagement />
          </RequireRole>
        </RequireAuth>
      )}
    />

    {/* Catch-all: Redirect unknown links to Home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);


export default App;   