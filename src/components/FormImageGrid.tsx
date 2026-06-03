import { useRef, useState } from 'react';
import { X, Star, GripVertical } from 'lucide-react';

export type SavedImageItem = { id: string; url: string };
export type NewImageItem = { file: File; preview: string; key: string };

export type ImageGridItem =
  | { type: 'saved'; data: SavedImageItem }
  | { type: 'new'; data: NewImageItem };

interface FormImageGridProps {
  items: ImageGridItem[];
  deletingId: string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onSetPortada: (index: number) => void;
}

export default function FormImageGrid({
  items,
  deletingId,
  onReorder,
  onRemove,
  onSetPortada,
}: FormImageGridProps) {
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const getSrc = (item: ImageGridItem) =>
    item.type === 'saved' ? item.data.url : item.data.preview;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {items.map((item, idx) => {
        const isPortada = idx === 0;
        const isDeleting = item.type === 'saved' && deletingId === item.data.id;
        const src = getSrc(item);

        return (
          <div
            key={item.type === 'saved' ? item.data.id : item.data.key}
            draggable
            onDragStart={() => {
              dragIndex.current = idx;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(idx);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex.current != null && dragIndex.current !== idx) {
                onReorder(dragIndex.current, idx);
              }
              dragIndex.current = null;
              setDragOver(null);
            }}
            onDragEnd={() => {
              dragIndex.current = null;
              setDragOver(null);
            }}
            className={`relative flex flex-col items-center gap-1 rounded-xl transition ${
              dragOver === idx ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
            }`}
          >
            <div className="relative w-full aspect-square">
              <span className="absolute top-1 left-1 z-10 p-0.5 rounded bg-white/80 text-slate-500 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-3.5 w-3.5" />
              </span>
              <img
                src={src}
                alt=""
                className={`w-full h-full rounded-xl object-cover shadow-sm ${
                  isPortada ? 'ring-2 ring-indigo-600 ring-offset-2' : 'border border-slate-200'
                } ${isDeleting ? 'opacity-50' : ''}`}
              />
              {item.type === 'new' && (
                <span className="absolute top-1 right-8 text-[9px] font-medium bg-indigo-600 text-white rounded px-1">
                  Nueva
                </span>
              )}
              {isPortada && (
                <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-semibold uppercase bg-indigo-600 text-white rounded px-0.5 py-0.5">
                  Portada
                </span>
              )}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onRemove(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 z-10 disabled:opacity-60"
                title="Eliminar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {!isPortada && (
              <button
                type="button"
                onClick={() => onSetPortada(idx)}
                className="flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <Star className="w-3 h-3" />
                Portada
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
