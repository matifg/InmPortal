import { Link } from 'react-router-dom';
import { ArrowUp, Mail, MessageCircle } from 'lucide-react';

const footerLinkClass =
  'text-slate-400 hover:text-indigo-400 transition-all duration-200';

const footerHeadingClass =
  'text-sm font-semibold text-white tracking-wide uppercase mb-5';

const columnClass = 'flex flex-col h-full min-w-0';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300">
      <div className="max-w-screen-2xl mx-auto px-8 lg:px-12 py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.45fr_1fr_1fr] gap-10 lg:gap-14 items-stretch">
          {/* Marca */}
          <div className={columnClass}>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 group mb-5 transition-all duration-200"
            >
              <img
                src="/favicon.png"
                alt="Inmo360"
                className="h-11 w-11 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-bold text-xl text-white tracking-tight group-hover:text-indigo-300 transition-colors duration-200">
                Inmo360
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              La plataforma que conecta propietarios, inmobiliarias y compradores.
            </p>
          </div>

          {/* Contacto */}
          <div id="contacto" className={`${columnClass} lg:min-w-[280px]`}>
            <h3 className={footerHeadingClass}>Contacto</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/5493329691846"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-start gap-3 ${footerLinkClass}`}
                >
                  <MessageCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-400 group-hover:text-indigo-300 transition-all duration-200" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                      WhatsApp
                    </span>
                    <span className="text-sm text-slate-300 whitespace-nowrap group-hover:text-indigo-400 transition-all duration-200">
                      +54 9 3329 69-1846
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contacto@inmobiliaria360.com.ar"
                  className={`group flex items-start gap-3 ${footerLinkClass}`}
                >
                  <Mail className="h-5 w-5 shrink-0 mt-0.5 text-indigo-400 group-hover:text-indigo-300 transition-all duration-200" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                      Email
                    </span>
                    <span className="text-sm text-slate-300 whitespace-nowrap group-hover:text-indigo-400 transition-all duration-200">
                      contacto@inmobiliaria360.com.ar
                    </span>
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Navegación */}
          <div className={columnClass}>
            <h3 className={footerHeadingClass}>Navegación</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className={`text-sm ${footerLinkClass}`}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/propiedades" className={`text-sm ${footerLinkClass}`}>
                  Propiedades
                </Link>
              </li>
              <li>
                <Link to="/dashboard/nueva-propiedad" className={`text-sm ${footerLinkClass}`}>
                  Publicar propiedad
                </Link>
              </li>
              <li>
                <a href="/#contacto" className={`text-sm ${footerLinkClass}`}>
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Desarrollado por */}
          <div className={columnClass}>
            <h3 className={footerHeadingClass}>Powered by</h3>
            <a
              href="https://www.baraderodevlabs.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full rounded-xl border border-indigo-500/25 bg-slate-800/70 px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/15"
            >
              <span className="block text-lg font-bold text-indigo-500 group-hover:text-indigo-400 transition-all duration-200">
                Baradero Devs
              </span>
              <span className="block text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-all duration-200">
                Desarrollo de software a medida.
              </span>
            </a>
          </div>
        </div>

        <div className="mt-14 sm:mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <p className="text-xs sm:text-sm text-slate-500 shrink-0">
              © 2026 Inmo360. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end">
              <Link
                to="/politica-de-privacidad"
                className={`text-xs sm:text-sm whitespace-nowrap ${footerLinkClass}`}
              >
                Política de Privacidad
              </Link>
              <Link
                to="/terminos-y-condiciones"
                className={`text-xs sm:text-sm whitespace-nowrap ${footerLinkClass}`}
              >
                Términos y Condiciones
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-indigo-400 whitespace-nowrap transition-all duration-200"
              >
                <ArrowUp className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
                Volver arriba
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
