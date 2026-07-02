import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import AgentPanel from './pages/AgentPanel';
import PropertyForm from './pages/PropertyForm';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterConfirm from './pages/RegisterConfirm';
import VerifyEmail from './pages/VerifyEmail';
import EditProperty from './pages/EditProperty'; // 🔥 IMPORTANTE
import AgentProfile from './pages/AgentProfile';
import AdminDashboard from './pages/AdminDashboard';

import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';
import ScrollToTop from './components/ScrollToTop';

const AUTH_PATHS = ['/login', '/register', '/registro/confirmacion', '/verificar-email'];

function AppLayout() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <div className={`font-sans text-gray-900 flex flex-col ${isAuthPage ? 'h-dvh overflow-hidden' : 'min-h-screen bg-gray-50'}`}>
      <Toaster position="top-right" />
      {!isAuthPage && <Navbar />}
      <div className={isAuthPage ? 'flex-1 min-h-0' : 'flex-grow'}>
        <Routes>

            {/* PUBLICAS */}
            <Route path="/" element={<Home />} />
            <Route path="/propiedades" element={<Home />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registro/confirmacion" element={<RegisterConfirm />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />

            {/* AGENTE — rutas canónicas */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="AGENTE">
                <AgentPanel />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/nueva-propiedad" element={
              <ProtectedRoute requiredRole="AGENTE">
                <PropertyForm />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/perfil" element={
              <ProtectedRoute requiredRole="AGENTE">
                <AgentProfile />
              </ProtectedRoute>
            } />

            {/* Redirecciones legacy */}
            <Route path="/agent" element={<Navigate to="/dashboard" replace />} />
            <Route path="/agent/nueva-propiedad" element={<Navigate to="/dashboard/nueva-propiedad" replace />} />

            {/* ADMIN DASHBOARD */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* 🔥 EDITAR PROPIEDAD (CLAVE) */}
            <Route path="/propiedad/editar/:id" element={
              <ProtectedRoute requiredRole="AGENTE">
                <EditProperty />
              </ProtectedRoute>
            } />

        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SessionManager />
      <ScrollToTop />
      <AppLayout />
    </Router>
  );
}