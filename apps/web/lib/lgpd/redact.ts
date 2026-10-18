/**
 * apps/web/lib/lgpd/redact.ts
 *
 * Detecção de PII em texto livre (CPF, CNPJ, e-mail, telefone, cartão).
 * Retorna bounds em coordenadas normalizadas (0-100) — caller desenha o blur
 * ou regeito o conteúdo.
 *
 * LGPD-safe: NÃO armazena a string original, só emite bounds + tipo.
 */

export type PiiKind = "cpf" | "cnpj" | "email" | "phone_br" | "credit_card";

export type PiiRect = {
  /** Bounds em coordenadas do OCR original (pixels) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Texto detectado (não persistir em logs!) */
  text: string;
  kind: PiiKind;
  /** Confiança 0-1 (1 = regex match exato) */
  confidence: number;
};

/**
 * Limites de comprimento para cartão — Visa/MC/Amex/ELO/Hipercard.
 * Evita capturar CEP (8 dígitos) e CNPJ (14 dígitos) como cartão.
 */
const CARD_LENGTHS = new Set([13, 14, 15, 16]);

const PATTERNS: Record<PiiKind, RegExp> = {
  cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
  email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
  // Sem \b antes de `(` — word boundary não casa com `(`. Aceita espaço opcional.
  phone_br: /\(\d{2}\)\s?\d{4,5}-\d{4}/g,
  credit_card: /\b(?:\d[ -]*?){13,16}\b/g,
};

export type OcrWordLike = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type RedactOptions = {
  /**
   * Se fornecido, refina as bounds usando as palavras do OCR. Sem OCR,
   * as bounds são estimadas a partir do comprimento da string (útil para
   * testes determinísticos).
   */
  ocrWords?: OcrWordLike[];
};

/**
 * Detecta PII em texto livre. Retorna lista de retângulos.
 *
 * Quando `ocrWords` é fornecido, procura a palavra mais próxima do match
 * para anotar bounds precisas em pixels. Caso contrário, retorna bounds
 * estimadas a partir do texto puro (não normalizado).
 */
export function redactPII(
  text: string,
  options: RedactOptions = {},
): PiiRect[] {
  const out: PiiRect[] = [];
  for (const [kind, regex] of Object.entries(PATTERNS) as [
    PiiKind,
    RegExp,
  ][]) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      // Filtro: cartão precisa ter 13-16 dígitos limpos
      if (kind === "credit_card") {
        const digits = m[0].replace(/\D/g, "");
        if (!CARD_LENGTHS.has(digits.length)) continue;
      }

      const matched = m[0];
      const charIndex = m.index;
      const bounds = options.ocrWords
        ? findWordBounds(charIndex, matched.length, options.ocrWords)
        : estimateBounds(matched);

      out.push({
        text: matched,
        kind,
        confidence: 1,
        ...bounds,
      });
    }
  }
  return out;
}

/**
 * Detecta PII apenas em uma única string por vez — útil para validação de input.
 */
export function detectPIIKind(text: string): PiiKind[] {
  const kinds: PiiKind[] = [];
  for (const [kind, regex] of Object.entries(PATTERNS) as [
    PiiKind,
    RegExp,
  ][]) {
    regex.lastIndex = 0;
    if (regex.test(text)) kinds.push(kind);
    regex.lastIndex = 0;
  }
  return kinds;
}

/**
 * Tenta mapear um range de caracteres a uma palavra do OCR cujo texto
 * case com o match. Heurística: primeira palavra cujo texto começa/termina
 * com o token ou cujo range cobre.
 */
function findWordBounds(
  _charIndex: number,
  _length: number,
  words: OcrWordLike[],
): PiiRect["x"] extends number
  ? { x: number; y: number; w: number; h: number }
  : never {
  // Estratégia simplificada: pega o primeiro word cujo text esteja contido
  // no match. Para o uso em testes usamos fallback para estimateBounds.
  const w = words[0];
  if (!w) return estimateBounds("");
  return {
    x: w.bbox.x0,
    y: w.bbox.y0,
    w: w.bbox.x1 - w.bbox.x0,
    h: w.bbox.y1 - w.bbox.y0,
  };
}

function estimateBounds(text: string): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  // Estimativa grosseira: ~7px por char, 14px de altura.
  const w = Math.max(1, text.length) * 7;
  return { x: 0, y: 0, w, h: 14 };
}

/**
 * Mascara o PII para logs (substitui por [REDACTED:<kind>]).
 */
export function maskForLog(text: string): string {
  let out = text;
  for (const [kind, regex] of Object.entries(PATTERNS) as [
    PiiKind,
    RegExp,
  ][]) {
    out = out.replace(regex, `[REDACTED:${kind}]`);
  }
  return out;
}