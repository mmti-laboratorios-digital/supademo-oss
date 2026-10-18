#!/usr/bin/env tsx
/**
 * scripts/check-dpo-missing.ts
 * -----------------------------------------------------------------------------
 * Verifica que NÃO restam placeholders relacionados ao Encarregado (DPO)
 * nos documentos jurídicos em `legal/*.md` e `legal/*.json`.
 *
 * Este script é BLOQUEADOR no CI: garante que a DemoBR não publique
 * documentos com nome de DPO inventado ou com placeholders visíveis.
 *
 * Placeholders a detectar (LGPD art. 41):
 *   - placeholder@demobr.com.br
 *   - dpo@demobr.com.br (endereço antigo a ser substituído quando o DPO
 *     formal for contratado — uso atual restrito a DPO.md e DPO-PROCESS.md,
 *     que documentam intencionalmente o histórico)
 *   - DPO_NAME_AQUI
 *   - DPO_NAME
 *   - [NOME_DO_DPO]
 *   - {nome_do_DPO}
 *   - _a definir_ (no contexto da linha "Encarregado" / "DPO" em
 *     CHANGELOG-DPO.md — uso intencional quando a coluna indica "nome
 *     ainda não definido")
 *
 * Whitelist: arquivos em `legal/` que documentam intencionalmente o
 * placeholder (DPO.md, DPO-PROCESS.md, ADVOGADO-CHECKLIST.md) podem
 * conter `dpo@demobr.com.br` em menções históricas. Apenas
 * `placeholder@demobr.com.br` é considerado placeholder operacional.
 *
 * Exit code:
 *   0 → sem placeholders pendentes
 *   1 → placeholders pendentes (CI falha)
 *   2 → erro de configuração (pasta legal/ ausente, etc.)
 *
 * Uso:
 *   pnpm exec tsx scripts/check-dpo-missing.ts
 *   pnpm exec tsx scripts/check-dpo-missing.ts --json   # saída em JSON
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

/* -------------------------------------------------------------------------- */
/* Configuração                                                                */
/* -------------------------------------------------------------------------- */

const ROOT = process.cwd();
const LEGAL_DIR = join(ROOT, "legal");

/**
 * Padrões que indicam placeholder ativo do DPO.
 * Quando o DPO formal for contratado, todos devem ser removidos dos
 * docs em `legal/` (exceto whitelist explícita).
 */
const PLACEHOLDER_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /placeholder@demobr\.com\.br/gi,
    label: "placeholder@demobr.com.br",
  },
  {
    pattern: /\bDPO_NAME_AQUI\b/g,
    label: "DPO_NAME_AQUI",
  },
  {
    pattern: /\bDPO_NAME\b/g,
    label: "DPO_NAME",
  },
  {
    pattern: /\[NOME_DO_DPO\]/g,
    label: "[NOME_DO_DPO]",
  },
  {
    pattern: /\[nome_do_dpo\]/gi,
    label: "[nome_do_dpo]",
  },
  {
    pattern: /\{nome_do_DPO\}/g,
    label: "{nome_do_DPO}",
  },
  {
    pattern: /\{nome_do_dpo\}/g,
    label: "{nome_do_dpo}",
  },
];

/**
 * Arquivos onde `placeholder@demobr.com.br` é usado intencionalmente
 * (documentam o estado atual "DPO pendente"). Esses arquivos são
 * isentos da verificação para esse padrão específico.
 */
const WHITELIST_PLACEHOLDER_EMAIL = new Set([
  "DPO.md",
  "DPO-PROCESS.md",
  "ADVOGADO-CHECKLIST.md",
  "CHANGELOG-DPO.md", // cabeçalho do changelog
  "README.md", // seção de contato
]);

/**
 * Extensões de arquivo a verificar.
 */
const VALID_EXTENSIONS = new Set([".md", ".json"]);

/* -------------------------------------------------------------------------- */
/* Tipos                                                                       */
/* -------------------------------------------------------------------------- */

type Finding = {
  file: string;
  line: number;
  pattern: string;
  context: string;
};

type Report = {
  ok: boolean;
  scannedFiles: number;
  findings: Finding[];
  scannedAt: string;
};

/* -------------------------------------------------------------------------- */
/* Funções                                                                     */
/* -------------------------------------------------------------------------- */

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(path: string): Promise<string> {
  return readFile(path, "utf8");
}

function trimContext(raw: string): string {
  // Limita o contexto a 120 chars e remove quebras de linha
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

async function scanFile(filePath: string): Promise<Finding[]> {
  const relPath = relative(ROOT, filePath);
  const fileName = relPath.split("/").pop() ?? "";
  const isWhitelisted = WHITELIST_PLACEHOLDER_EMAIL.has(fileName);

  let content: string;
  try {
    content = await readUtf8(filePath);
  } catch (err) {
    throw new Error(`Falha ao ler ${relPath}: ${(err as Error).message}`);
  }

  const lines = content.split(/\r?\n/);
  const findings: Finding[] = [];

  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    // Padrão `placeholder@demobr.com.br` é isento nos arquivos whitelisted
    if (
      label === "placeholder@demobr.com.br" &&
      isWhitelisted
    ) {
      continue;
    }

    // Reset lastIndex (stateful regex global)
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const matchIndex = match.index;
      // Encontra a linha correspondente
      const before = content.slice(0, matchIndex);
      const lineNumber = before.split(/\r?\n/).length;
      const lineContent = lines[lineNumber - 1] ?? "";
      findings.push({
        file: relPath,
        line: lineNumber,
        pattern: label,
        context: trimContext(lineContent),
      });
    }
  }

  return findings;
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await listFiles(full);
      out.push(...sub);
    } else if (entry.isFile() && VALID_EXTENSIONS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const jsonOutput = args.has("--json");

  if (!(await exists(LEGAL_DIR))) {
    const msg = `❌ Pasta legal/ não encontrada em ${ROOT}`;
    if (jsonOutput) {
      console.log(
        JSON.stringify(
          { ok: false, error: msg, scannedAt: new Date().toISOString() },
          null,
          2,
        ),
      );
    } else {
      console.error(msg);
    }
    process.exit(2);
  }

  const files = await listFiles(LEGAL_DIR);
  const allFindings: Finding[] = [];

  for (const file of files) {
    const findings = await scanFile(file);
    allFindings.push(...findings);
  }

  const report: Report = {
    ok: allFindings.length === 0,
    scannedFiles: files.length,
    findings: allFindings,
    scannedAt: new Date().toISOString(),
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.ok) {
    console.log(
      `✅ check-dpo-missing: ${report.scannedFiles} arquivo(s) verificado(s); nenhum placeholder DPO pendente.`,
    );
  } else {
    console.error(
      `❌ check-dpo-missing: ${report.findings.length} placeholder(s) DPO pendente(s) em ${report.scannedFiles} arquivo(s) verificado(s).`,
    );
    console.error("");
    console.error("Placeholders encontrados:");
    for (const finding of report.findings) {
      console.error(
        `  ${finding.file}:${finding.line}  [${finding.pattern}]  ${finding.context}`,
      );
    }
    console.error("");
    console.error(
      "Ação: após a contratação formal do DPO, substitua os placeholders",
    );
    console.error(
      "pelo nome/e-mail real em todos os arquivos. Veja instruções em",
    );
    console.error(
      "  legal/DPO.md §10 e legal/DPO-PROCESS.md §3 (Fase 3).",
    );
    console.error("");
    console.error(
      "Para localizar programaticamente: grep -rn 'placeholder@demobr' legal/",
    );
  }

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ check-dpo-missing: erro inesperado:", err);
  process.exit(2);
});