import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import AgentPanel from './pages/AgentPanel';
import PropertyForm from './pages/PropertyForm';
import Login from './pages/Login';
import Register from './pages/Register';
import EditProperty from './pages/EditProperty'; // 🔥 IMPORTANTE
import AdminDashboard from './pages/AdminDashboard';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
        
        <Toaster position="top-right" />

        <Navbar />

        <div className="flex-grow">
          <Routes>

            {/* PUBLICAS */}
            <Route path="/" element={<Home />} />
            <Route path="/propiedades" element={<Home />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* AGENTE */}
            <Route path="/agent" element={<AgentPanel />} />
            <Route path="/agent/nueva-propiedad" element={
              <ProtectedRoute requiredRole="AGENTE">
                <PropertyForm />
              </ProtectedRoute>
            } />

            {/* DASHBOARD AGENTE */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="AGENTE">
                <AgentPanel />
              </ProtectedRoute>
            } />

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
    </Router>
  );
}