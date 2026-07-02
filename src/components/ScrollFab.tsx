import { useEffect, useState, type RefObject } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FabMode = 'listado' | 'more' | 'top';

type ScrollFabProps = {
  listadoRef: RefObject<HTMLElement | null>;
};

const BOTTOM_THRESHOLD_PX = 100;

export default function ScrollFab({ listadoRef }: ScrollFabProps) {
  const [listadoInView, setListadoInView] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const el = listadoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setListadoInView(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '-72px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [listadoRef]);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setFabVisible(scrollY > 150);
      setAtBottom(scrollY >= maxScroll - BOTTOM_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (!fabVisible) return null;

  const scrollBehavior = reducedMotion ? ('auto' as const) : ('smooth' as const);

  const mode: FabMode = atBottom ? 'top' : listadoInView ? 'more' : 'listado';

  const config = {
    listado: {
      label: 'Ver listado',
      ariaLabel: 'Ir al listado de propiedades',
      icon: ChevronDown,
    },
    more: {
      label: 'Seguir viendo',
      ariaLabel: 'Seguir viendo propiedades',
      icon: ChevronDown,
    },
    top: {
      label: 'Volver arriba',
      ariaLabel: 'Volver al inicio',
      icon: ChevronUp,
    },
  }[mode];

  const Icon = config.icon;

  const handleClick = () => {
    if (mode === 'listado') {
      listadoRef.current?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      return;
    }
    if (mode === 'more') {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: scrollBehavior });
      return;
    }
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={config.ariaLabel}
      className="fixed z-40 bottom-6 right-4 sm:right-6 flex h-12 w-12 sm:w-auto sm:px-5 items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-900/25 ring-1 ring-white/20 transition-all duration-200 hover:scale-[1.03] active:scale-95"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline text-sm">{config.label}</span>
    </button>
  );
}
