const ALLOWED = new Set(['B', 'STRONG', 'BR', 'P', 'DIV', 'UL', 'OL', 'LI']);

/** Texto plano → HTML básico (saltos de línea). */
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/** Solo etiquetas de formato simples; sin scripts ni atributos. */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html?.trim()) return '';
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    const inner = Array.from(el.childNodes).map(walk).join('');

    if (tag === 'BR') return '<br>';
    if (!ALLOWED.has(tag)) return inner;
    if (tag === 'B' || tag === 'STRONG') return `<strong>${inner}</strong>`;
    if (tag === 'P' || tag === 'DIV') return inner ? `${inner}<br>` : '<br>';
    if (tag === 'LI') return `<li>${inner}</li>`;
    if (tag === 'UL') return `<ul>${inner}</ul>`;
    if (tag === 'OL') return `<ol>${inner}</ol>`;
    return inner;
  };

  return Array.from(root.childNodes)
    .map(walk)
    .join('')
    .replace(/(?:<br>\s*)+$/i, '')
    .trim();
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = sanitizeDescriptionHtml(html);
  return (el.textContent || '').replace(/\u00a0/g, ' ').trim();
}

export function descriptionHasContent(htmlOrText: string): boolean {
  return htmlToPlainText(htmlOrText).length > 0;
}
