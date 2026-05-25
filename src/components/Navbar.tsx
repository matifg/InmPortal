import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LogIn,
  LogOut,
  Menu,
  X,
  Building2,
  User2,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userName, setUserName] = useState(localStorage.getItem('nombre') || '');
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Actualiza estado al cambiar ruta (login/logout)
  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
    setUserName(localStorage.getItem('nombre') || '');
  }, [location.pathname]);

  // Cierra el dropdown si se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdown(false);
      }
    }
    if (dropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdown]);

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setDropdown(false);
    navigate('/login', { replace: true });
  };

  // Helper para active state
  const isActive = (path: string) => location.pathname === path;

  // Avatar circular con inicial
  const avatar = (
    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg shadow-sm select-none">
      {(userName ? userName.charAt(0) : 'M').toUpperCase()}
    </div>
  );

  // Links principales según role
  const renderLinks = () => {
    if (!token) {
      // CLIENTE (no logueado)
      return (
        <>
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 hover:scale-[1.02] ${isActive('/') ? 'text-indigo-700 bg-indigo-50 shadow-sm' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
          >
            <Home className="h-5 w-5" />
            Inicio
          </Link>
          <Link
            to="/propiedades"
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 hover:scale-[1.02] ${isActive('/propiedades') ? 'text-indigo-700 bg-indigo-50 shadow-sm' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
          >
            <Building2 className="h-5 w-5" />
            Propiedades
          </Link>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-all duration-200 hover:scale-[1.02] text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <LogIn className="h-5 w-5" />
            Ingresar
          </button>
        </>
      );
    }

    if (role === 'AGENTE') {
      const panelActive =
        location.pathname === '/dashboard' ||
        location.pathname.startsWith('/dashboard/') ||
        location.pathname.startsWith('/propiedad/editar');

      return (
        <>
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-all duration-200 hover:scale-[1.02] ${panelActive ? 'text-indigo-700 bg-indigo-50 shadow-sm' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Mis propiedades
          </Link>
          <Link
            to="/dashboard/nueva-propiedad"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            style={{ boxShadow: '0 2px 8px 0 rgba(34,197,94,0.10)' }}
          >
            <PlusCircle className="h-5 w-5" />
            Publicar
          </Link>
        </>
      );
    }

    if (role === 'ADMIN') {
      // Solo Admin Panel, sin Agentes ni Membresías
      return (
        <>
          <Link
            to="/admin"
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-all duration-200 hover:scale-[1.02] ${isActive('/admin') ? 'text-indigo-700 bg-indigo-50 shadow-sm' : 'text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900'
              }`}
          >
            <ShieldCheck className="h-5 w-5" />
            Admin Panel
          </Link>
        </>
      );
    }

    return null;
  };

  // Menú usuario tipo dropdown
  const renderUserDropdown = () => {
    if (!token) return null;
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdown((d) => !d)}
          className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-100 hover:text-indigo-700 transition-all duration-200"
        >
          {avatar}
          <span className="ml-1">{userName || 'Mi cuenta'}</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-fade-in transition-all duration-200 origin-top-right">
            <button
              onClick={() => {
                setDropdown(false);
                if (role === 'ADMIN') navigate('/admin');
                else if (role === 'AGENTE') navigate('/dashboard');
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-700 transition-all duration-200"
            >
              <UserCircle className="h-5 w-5" />
              Mi cuenta
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-md text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    );
  };

  // Mobile links
  const renderMobileLinks = () => (
    <div className="flex flex-col gap-2 py-2">
      {renderLinks()}
      {token && (
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-red-600 font-medium hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LOGO */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl text-gray-900">Inmo360</span>
            </Link>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center space-x-2">
            {renderLinks()}
            {renderUserDropdown()}
          </div>

          {/* MOBILE BUTTON */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-3">
          {renderMobileLinks()}
        </div>
      )}
    </nav>
  );
}