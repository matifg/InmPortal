import { Link, useLocation } from 'react-router-dom';
import { Home, UserCircle, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Mock user state (in a real app, this would come from Auth context)
  const isAgent = location.pathname.includes('/agent');

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl text-gray-900">InmoPortal</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/propiedades" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md font-medium transition-colors">
              Propiedades
            </Link>
            
            <div className="border-l border-gray-200 h-6 mx-2"></div>
            
            {isAgent ? (
              <Link to="/agent" className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors">
                <UserCircle className="h-5 w-5" />
                <span>Panel de Agente</span>
              </Link>
            ) : (
              <Link to="/agent" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md font-medium transition-colors">
                <LogIn className="h-5 w-5" />
                <span>Acceso Agentes</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Inicio
            </Link>
            <Link 
              to="/propiedades" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Propiedades
            </Link>
            <Link 
              to="/agent" 
              className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 mt-4 border border-indigo-100"
              onClick={() => setIsOpen(false)}
            >
              {isAgent ? 'Panel de Agente' : 'Acceso Agentes'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
