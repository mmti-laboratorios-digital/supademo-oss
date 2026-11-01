/**
 * apps/web/app/(marketing)/content/legalLoader.ts
 * -----------------------------------------------------------------------------
 * Carrega os documentos legais de `legal/` (raiz do repo) e converte markdown
 * em blocos renderizáveis por TSX.
 *
 * ⚠️ **Por que isso existe:** a Chrome Web Store **exige** uma URL de
 * política de privacidade acessível publicamente (HTTP 200, sem login) para
 * aprovar a extensão. Os documentos já existem em `legal/*.md` — mas não havia
 * rota que os servisse. Sem elas, a submissão da extensão (F9.6) seria
 * rejeitada.
 *
 * O parser é intencionalmente simples: cobre o subconjunto de markdown usado
 * nos documentos legais (headings, parágrafos, listas, tabelas, blockquotes,
 * código inline). Não é um renderer markdown geral.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type LegalBlock =
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string; id: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

export type LegalDocument = {
  title: string;
  blocks: LegalBlock[];
};

/**
 * Diretórios candidatos onde os documentos legais podem estar.
 *
 * ⚠️ O caminho varia por ambiente:
 *  - **dev**: `process.cwd()` = `apps/web` → `../../legal` = raiz do repo
 *  - **Docker build**: cwd = `/repo/apps/web` → `../../legal` = `/repo/legal`
 *  - **Docker runner (standalone)**: cwd = `/app` → o Next standalone **não**
 *    inclui `legal/` automaticamente — o Dockerfile faz `COPY` explícito
 *    para `/app/legal`.
 *
 * Por isso o loader tenta vários e usa o primeiro que existir.
 */
const LEGAL_DIR_CANDIDATES = [
  path.join(process.cwd(), "..", "..", "legal"),
  path.join(process.cwd(), "..", "legal"),
  path.join(process.cwd(), "legal"),
  "/repo/legal",
  "/app/legal",
];

async function resolveLegalDir(): Promise<string | null> {
  for (const dir of LEGAL_DIR_CANDIDATES) {
    try {
      await fs.access(path.join(dir, "privacy-policy.md"));
      return dir;
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

/** Documento legal → rota pública do site. */
export const LEGAL_DOCUMENTS = {
  privacidade: { file: "privacy-policy.md", title: "Política de Privacidade" },
  termos: { file: "terms-of-service.md", title: "Termos de Uso" },
  cookies: { file: "cookie-policy.md", title: "Política de Cookies" },
} as const;

export type LegalSlug = keyof typeof LEGAL_DOCUMENTS;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Remove marcação inline para o texto exibido. */
function stripInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => stripInline(c.trim()));
}

export async function loadLegalDocument(slug: LegalSlug): Promise<LegalDocument | null> {
  const entry = LEGAL_DOCUMENTS[slug];
  if (!entry) return null;

  const legalDir = await resolveLegalDir();
  if (!legalDir) return null;

  let raw: string;
  try {
    raw = await fs.readFile(path.join(legalDir, entry.file), "utf8");
  } catch {
    return null;
  }

  // Remove o H1 inicial (vira o título da página).
  const body = raw.replace(/^#\s+.*\n+/, "");
  const lines = body.split("\n");
  const blocks: LegalBlock[] = [];

  let paragraph: string[] = [];
  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "p", text: stripInline(text) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Tabela: linha com `|` seguida de separador `|---|`.
    if (trimmed.startsWith("|") && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() ?? "")) {
      flushParagraph();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        rows.push(splitTableRow((lines[i] ?? "").trim()));
        i++;
      }
      i--;
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      const text = trimmed.slice(3).trim();
      blocks.push({ type: "h2", text: stripInline(text), id: slugify(text) });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      const text = trimmed.slice(4).trim();
      blocks.push({ type: "h3", text: stripInline(text), id: slugify(text) });
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      blocks.push({ type: "quote", text: stripInline(trimmed.slice(2).trim()) });
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        buf.push(lines[i] ?? "");
        i++;
      }
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? "").trim())) {
        items.push(stripInline((lines[i] ?? "").trim().replace(/^[-*]\s+/, "")));
        i++;
      }
      i--;
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? "").trim())) {
        items.push(stripInline((lines[i] ?? "").trim().replace(/^\d+\.\s+/, "")));
        i++;
      }
      i--;
      blocks.push({ type: "ol", items });
      continue;
    }

    // Linha horizontal — ignora.
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph();

  return { title: entry.title, blocks };
}
