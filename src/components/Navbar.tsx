import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, LogIn, LogOut, Menu, X, Building2 } from 'lucide-react'; // 👈 Importa Building2
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(localStorage.getItem('user'));

  // 🔥 Esto hace que la navbar reaccione al login/logout
  useEffect(() => {
    setUser(localStorage.getItem('user'));
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* LOGO */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-600" /> {/* 👈 Nuevo icono y color */}
              <span className="font-bold text-xl text-gray-900">Inmo360</span> {/* 👈 Nuevo nombre */}
            </Link>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-indigo-600 px-3 py-2 cursor-pointer hover:opacity-80 transition duration-200"
            >
              Inicio
            </Link>

            <Link
              to="/propiedades"
              className="text-gray-600 hover:text-indigo-600 px-3 py-2 cursor-pointer hover:opacity-80 transition duration-200"
            >
              Propiedades
            </Link>

            {!user ? (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-indigo-600 font-medium px-3 py-2 hover:bg-indigo-50 rounded-md cursor-pointer hover:opacity-80 transition duration-200"
              >
                <LogIn className="h-5 w-5" />
                Acceso Agentes
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-indigo-600 font-medium px-3 py-2 hover:bg-indigo-50 rounded-md cursor-pointer hover:opacity-80 transition duration-200"
                >
                  Mis Propiedades
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 font-medium px-3 py-2 hover:bg-red-50 rounded-md cursor-pointer hover:opacity-80 transition duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar sesión
                </button>
              </>
            )}
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
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-3 py-2 space-y-2">

            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer hover:opacity-80 transition duration-200"
            >
              Inicio
            </Link>

            <Link
              to="/propiedades"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer hover:opacity-80 transition duration-200"
            >
              Propiedades
            </Link>

            {!user ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 rounded-md text-indigo-600 hover:bg-indigo-50 cursor-pointer hover:opacity-80 transition duration-200"
              >
                Acceso Agentes
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-indigo-600 hover:bg-indigo-50 cursor-pointer hover:opacity-80 transition duration-200"
                >
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 cursor-pointer hover:opacity-80 transition duration-200"
                >
                  Cerrar sesión
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </nav>
  );
}