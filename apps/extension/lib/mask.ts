/**
 * LGPD pré-captura — substitui valores sensíveis antes de enviar para a API.
 *
 * Heurística:
 *  - input[type=password] → sempre mascará
 *  - input[type=email] / name=email → hash (mantém forma para debug)
 *  - input[name*=cpf|cnpj|credit|card|token|secret] → mascara
 *  - input[name*=phone|tel|celular] → mascara últimos 4 dígitos
 *  - qualquer outro valor em input → mantido (creator pode editar)
 */

export function shouldMask(el: Element): boolean {
  if (!(el instanceof HTMLInputElement)) return false;
  const t = (el.type ?? "").toLowerCase();
  if (t === "password") return true;
  const name = (el.name ?? "").toLowerCase();
  if (t === "email" || name.includes("email")) return true;
  if (/cpf|cnpj|card|credit|token|secret|senha/i.test(name)) return true;
  if (/phone|tel|celular|whats/i.test(name)) return true;
  return false;
}

export function maskSensitiveValue(value: string): string {
  if (!value) return "";
  const len = value.length;
  if (len <= 4) return "*".repeat(len);
  return `${value.slice(0, 2)}${"*".repeat(Math.max(0, len - 4))}${value.slice(-2)}`;
}

/**
 * Aplica um filtro CSS inline em elementos sensíveis no site sendo capturado
 * durante o overlay de captura. Útil para ofuscar senhas em formulários antes do screenshot.
 */
export function applyVisualMask(el: HTMLElement): void {
  if (!(el instanceof HTMLInputElement)) return;
  if (el.type === "password") {
    el.style.filter = "blur(6px)";
  }
}

export function clearVisualMask(el: HTMLElement): void {
  if (el instanceof HTMLInputElement) {
    el.style.filter = "";
  }
}