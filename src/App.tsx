import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import AgencyPublicProfile from './pages/AgencyPublicProfile';
import NotFound from './pages/NotFound';

import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';
import ScrollToTop from './components/ScrollToTop';

// Panel, auth y admin no se indexan: se cargan bajo demanda para aliviar el bundle público.
const AgentPanel = lazy(() => import('./pages/AgentPanel'));
const PropertyForm = lazy(() => import('./pages/PropertyForm'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const RegisterConfirm = lazy(() => import('./pages/RegisterConfirm'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const RecuperarPassword = lazy(() => import('./pages/RecuperarPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const EditProperty = lazy(() => import('./pages/EditProperty')); // 🔥 IMPORTANTE
const AgentProfile = lazy(() => import('./pages/AgentProfile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AUTH_PATHS = ['/login', '/register', '/registro/confirmacion', '/verificar-email', '/recuperar-password', '/restablecer-password'];

function AppLayout() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <div className={`font-sans text-gray-900 flex flex-col ${isAuthPage ? 'h-dvh overflow-hidden' : 'min-h-screen bg-gray-50'}`}>
      <Toaster position="top-right" />
      {!isAuthPage && <Navbar />}
      <div className={isAuthPage ? 'flex-1 min-h-0 overflow-y-auto' : 'flex-grow'}>
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
          }
        >
        <Routes>

            {/* PUBLICAS */}
            <Route path="/" element={<Home />} />
            <Route path="/propiedades" element={<Home />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />
            <Route path="/inmobiliaria/:agenteId" element={<AgencyPublicProfile />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registro/confirmacion" element={<RegisterConfirm />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/restablecer-password" element={<ResetPassword />} />

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

            <Route path="*" element={<NotFound />} />

        </Routes>
        </Suspense>
      </div>
      {!isAuthPage && <Footer />}
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