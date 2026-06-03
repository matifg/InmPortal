import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const go = useCallback(
    (dir: -1 | 1) => {
      onIndexChange((index + dir + images.length) % images.length);
    },
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, go]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Galería de imágenes"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <span className="text-sm font-medium">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 min-h-0">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 md:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        <img
          src={images[index]}
          alt={`Imagen ${index + 1}`}
          className="max-h-[calc(100vh-8rem)] max-w-full object-contain rounded-lg"
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 md:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="shrink-0 px-4 pb-6 flex gap-2 overflow-x-auto justify-center">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
