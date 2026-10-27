import { useEffect, useRef } from 'react';
import { Bold } from 'lucide-react';
import { plainTextToHtml, sanitizeDescriptionHtml } from '../lib/safeHtml';

type DescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  hasError?: boolean;
  placeholder?: string;
};

/**
 * Editor liviano para el agente: botón Negrita (como Word) + vista WYSIWYG.
 * Guarda HTML sanitizado en el mismo campo descripcion.
 */
export default function DescriptionEditor({
  value,
  onChange,
  hasError = false,
  placeholder = 'Destacá lo mejor de la propiedad: ambientes, amenities, entorno...',
}: DescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = plainTextToHtml(value);
    // Solo sincronizar desde afuera (carga / edit); no pisar mientras escribe.
    if (document.activeElement === el) return;
    if (el.innerHTML === next) return;
    el.innerHTML = next || '';
    lastEmitted.current = value;
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = sanitizeDescriptionHtml(el.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  };

  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand('bold');
    emit();
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition ${
        hasError
          ? 'border-red-400 bg-red-50/30'
          : 'border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
      }`}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyBold}
          title="Negrita"
          aria-label="Negrita"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 hover:bg-white hover:text-indigo-700 border border-transparent hover:border-gray-200 transition"
        >
          <Bold className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="text-[11px] text-gray-400 ml-1">Seleccioná texto y tocá Negrita</span>
      </div>
      <div
        ref={editorRef}
        id="field-description"
        role="textbox"
        aria-multiline
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="min-h-[6rem] max-h-64 overflow-y-auto px-4 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
