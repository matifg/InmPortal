import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface PropertyGalleryProps {
  images: string[];
  /** Limita la altura de la imagen principal (layout detalle / hero) */
  mainMaxHeight?: number;
}

export default function PropertyGallery({ images, mainMaxHeight }: PropertyGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (!images.length) {
    return (
      <div
        className={`rounded-2xl bg-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 border border-gray-200 ${
          mainMaxHeight ? `h-[${mainMaxHeight}px] max-h-[${mainMaxHeight}px]` : 'aspect-[4/3] md:aspect-[16/10] max-h-[min(70vh,520px)]'
        }`}
        style={mainMaxHeight ? { height: mainMaxHeight, maxHeight: mainMaxHeight } : undefined}
      >
        <Images className="h-12 w-12 opacity-40" />
        <span className="text-sm font-medium">Sin imágenes</span>
      </div>
    );
  }

  const go = (dir: -1 | 1) => {
    setActive((i) => (i + dir + images.length) % images.length);
  };

  const openLightbox = (index: number) => {
    setActive(index);
    setLightboxOpen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || images.length < 2) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <>
      <div className="w-full">
        <div
          className={`relative group w-full rounded-2xl overflow-hidden bg-slate-100 border border-gray-200 shadow-sm transition-shadow duration-200 hover:shadow-md ${
            mainMaxHeight
              ? ''
              : 'aspect-[4/3] md:aspect-[16/10] max-h-[min(70vh,520px)]'
          }`}
          style={mainMaxHeight ? { height: mainMaxHeight, maxHeight: mainMaxHeight } : undefined}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={() => openLightbox(active)}
            className="w-full h-full block cursor-zoom-in"
            aria-label="Ampliar imagen"
          >
            <img
              src={images[active]}
              alt={`Foto ${active + 1}`}
              className="w-full h-full object-cover"
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md z-10 transition md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md z-10 transition md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full pointer-events-none">
                {active + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-hide">
            {images.map((src, i) => (
              <button
                key={`thumb-${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`relative flex-shrink-0 snap-center w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.03] ${
                  active === i
                    ? 'border-indigo-600 ring-2 ring-indigo-500/25 opacity-100'
                    : 'border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-300'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={active}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActive}
        />
      )}
    </>
  );
}
