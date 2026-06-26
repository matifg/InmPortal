import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LogIn,
  LogOut,
  Menu,
  X,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { clearSession } from '../lib/auth';

const navLinkBase =
  'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200';

function navLinkClass(active: boolean) {
  return active
    ? `${navLinkBase} text-white bg-indigo-500/25 ring-1 ring-indigo-400/30`
    : `${navLinkBase} text-slate-300 hover:text-white hover:bg-white/10`;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userName, setUserName] = useState(localStorage.getItem('nombre') || '');
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
    setUserName(localStorage.getItem('nombre') || '');
  }, [location.pathname]);

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
    clearSession();
    setToken(null);
    setRole(null);
    setDropdown(false);
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  const avatar = (
    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-sm select-none ring-2 ring-indigo-400/40">
      {(userName ? userName.charAt(0) : 'M').toUpperCase()}
    </div>
  );

  const renderLinks = () => {
    if (!token) {
      return (
        <>
          <Link to="/" className={navLinkClass(isActive('/'))}>
            <Home className="h-5 w-5" />
            Inicio
          </Link>
          <Link to="/propiedades" className={navLinkClass(isActive('/propiedades'))}>
            <Building2 className="h-5 w-5" />
            Propiedades
          </Link>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className={`${navLinkBase} font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/40`}
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
        (location.pathname.startsWith('/dashboard/') &&
          !location.pathname.startsWith('/dashboard/perfil')) ||
        location.pathname.startsWith('/propiedad/editar');
      const profileActive = location.pathname === '/dashboard/perfil';

      return (
        <>
          <Link to="/dashboard" className={navLinkClass(panelActive)}>
            <LayoutDashboard className="h-5 w-5" />
            Mis propiedades
          </Link>
          <Link to="/dashboard/perfil" className={navLinkClass(profileActive)}>
            <UserCircle className="h-5 w-5" />
            Mi perfil
          </Link>
        </>
      );
    }

    if (role === 'ADMIN') {
      return (
        <Link to="/admin" className={navLinkClass(isActive('/admin'))}>
          <ShieldCheck className="h-5 w-5" />
          Admin Panel
        </Link>
      );
    }

    return null;
  };

  const renderUserDropdown = () => {
    if (!token) return null;
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdown((d) => !d)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          {avatar}
          <span className="ml-1 max-w-[120px] truncate">{userName || 'Mi cuenta'}</span>
          <svg className="w-4 h-4 ml-1 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2">
            <button
              onClick={() => {
                setDropdown(false);
                if (role === 'ADMIN') navigate('/admin');
                else if (role === 'AGENTE') navigate('/dashboard/perfil');
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-md text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition-all duration-200"
            >
              <UserCircle className="h-5 w-5" />
              Mi perfil
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

  const renderMobileLinks = () => (
    <div className="flex flex-col gap-2 py-2">
      {renderLinks()}
      {token && (
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 font-medium hover:bg-white/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      )}
    </div>
  );

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/favicon.png"
                alt="Inmo360"
                className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-xl text-white tracking-tight">Inmo360</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {renderLinks()}
            {renderUserDropdown()}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-3 pb-3">
          {renderMobileLinks()}
        </div>
      )}
    </nav>
  );
}
