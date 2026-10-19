/**
 * Gera um seletor CSS único e estável para um elemento DOM.
 *
 * Estratégia: id > atributos semânticos (data-*) > classes curtas > nth-of-type.
 * Cache simples por elemento para evitar recomputação.
 */

const cache = new WeakMap<Element, string>();

export function getCSSPath(el: Element): string {
  const cached = cache.get(el);
  if (cached) return cached;

  // 1) ID único e válido
  if (el.id && isValidIdent(el.id)) {
    const path = `#${el.id}`;
    cache.set(el, path);
    return path;
  }

  // 2) data-testid / data-key / data-qa
  const dt = el.getAttribute("data-testid");
  if (dt) {
    const path = `[data-testid="${cssEscape(dt)}"]`;
    cache.set(el, path);
    return path;
  }
  const dk = el.getAttribute("data-key");
  if (dk) {
    const path = `[data-key="${cssEscape(dk)}"]`;
    cache.set(el, path);
    return path;
  }
  const dq = el.getAttribute("data-qa");
  if (dq) {
    const path = `[data-qa="${cssEscape(dq)}"]`;
    cache.set(el, path);
    return path;
  }

  // 3) aria-label único
  const al = el.getAttribute("aria-label");
  if (al && document.querySelectorAll(`[aria-label="${cssEscape(al)}"]`).length === 1) {
    const path = `[aria-label="${cssEscape(al)}"]`;
    cache.set(el, path);
    return path;
  }

  // 4) Caminho com nth-of-type
  const segments: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (cur && cur.nodeType === Node.ELEMENT_NODE && depth < 8) {
    const tag = cur.tagName.toLowerCase();
    const parent: Element | null = cur.parentElement;
    const currentEl: Element = cur;

    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (c: Element) => c.tagName === currentEl.tagName,
      );
      const idx = sameTag.indexOf(currentEl) + 1;
      segments.unshift(`${tag}:nth-of-type(${idx})`);
    } else {
      segments.unshift(tag);
    }

    cur = parent;
    depth++;
  }
  const path = segments.join(" > ");
  cache.set(el, path);
  return path;
}

function isValidIdent(s: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(s);
}

function cssEscape(s: string): string {
  return s.replace(/(["\\])/g, "\\$1");
}
