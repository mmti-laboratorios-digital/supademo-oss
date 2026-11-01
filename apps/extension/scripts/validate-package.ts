/**
 * apps/extension/scripts/validate-package.ts
 * -----------------------------------------------------------------------------
 * Valida o pacote Chrome MV3 gerado antes de subir na Chrome Web Store.
 *
 * ⚠️ **Por que isso existe:** a extensão **nunca foi buildada na CI** (o job
 * de build da CI é o Docker do `apps/web`). Por isso dois bugs do scaffold
 * sobreviveram ~3 meses:
 *   1. os ícones em `public/icons/` eram **arquivos de texto** com um
 *      comentário de placeholder — a CWS rejeita com "Invalid icon file";
 *   2. o `manifest.json` pedia `host_permissions: ["<all_urls>"]`.
 *
 * A CWS é lenta e cara de iterar (dias a semanas de review). Este script
 * pega o erro em segundos, no CI.
 *
 * Uso:
 *   pnpm --filter extension exec tsx scripts/validate-package.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = resolve(HERE, "..");
const OUT_DIR = resolve(EXT_ROOT, ".output/chrome-mv3");

/** Permissões que o RFC §1.2 / MVP-PLAN §1357 proíbem. */
const FORBIDDEN_PERMISSIONS = ["tabCapture", "offscreen", "webRequest", "webRequestBlocking"];

/** Permissões que a extensão DEVE ter (mínimo enxuto). */
const REQUIRED_PERMISSIONS = ["activeTab", "storage", "scripting"];

/** Hosts que podem aparecer em host_permissions. */
const ALLOWED_HOST_SUFFIXES = ["easydemo.io", "localhost"];

type Manifest = {
  manifest_version: number;
  name?: string;
  version?: string;
  permissions?: string[];
  host_permissions?: string[];
  icons?: Record<string, string>;
  background?: { service_worker?: string };
  action?: { default_popup?: string };
};

type Finding = { level: "error" | "warn"; message: string };

const findings: Finding[] = [];

function error(message: string): void {
  findings.push({ level: "error", message });
}

function warn(message: string): void {
  findings.push({ level: "warn", message });
}

function dirname(p: string): string {
  return path.dirname(p);
}

function resolve(...parts: string[]): string {
  return path.resolve(...parts);
}

/** Assinatura PNG: 89 50 4E 47 0D 0A 1A 0A. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isValidPng(file: string): boolean {
  try {
    const buf = readFileSync(file);
    if (buf.length < 8) return false;
    return buf.subarray(0, 8).equals(PNG_MAGIC);
  } catch {
    return false;
  }
}

function main(): void {
  const manifestPath = path.join(OUT_DIR, "manifest.json");

  // 1. O build rodou?
  if (!statSyncSafe(manifestPath)) {
    error(`manifest.json não encontrado em ${OUT_DIR} — rode o build antes.`);
    report();
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  // 2. Manifest V3.
  if (manifest.manifest_version !== 3) {
    error(`manifest_version deve ser 3 (recebido: ${String(manifest.manifest_version)}).`);
  }

  // 3. Permissões: sem as proibidas, com as obrigatórias.
  const perms = manifest.permissions ?? [];
  for (const forbidden of FORBIDDEN_PERMISSIONS) {
    if (perms.includes(forbidden)) {
      error(`Permissão proibida "${forbidden}" — RFC §1.2 / MVP-PLAN §1357.`);
    }
  }
  for (const required of REQUIRED_PERMISSIONS) {
    if (!perms.includes(required)) {
      warn(`Permissão esperada ausente: "${required}".`);
    }
  }
  const unexpected = perms.filter((p) => !REQUIRED_PERMISSIONS.includes(p));
  if (unexpected.length > 0) {
    warn(`Permissões fora do mínimo esperado: ${unexpected.join(", ")}.`);
  }

  // 4. host_permissions: nada de <all_urls> nem wildcard amplo.
  const hosts = manifest.host_permissions ?? [];
  if (hosts.includes("<all_urls>")) {
    error('host_permissions contém "<all_urls>" — a CWS penaliza review.');
  }
  for (const host of hosts) {
    const isAllowed = ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host.includes(suffix) || host.includes(suffix.replace(".io", "")),
    );
    if (!isAllowed) {
      error(`host_permission fora do esperado: "${host}".`);
    }
  }

  // 5. Ícones: existem E são PNGs válidos (o bug do placeholder de texto).
  const icons = manifest.icons ?? {};
  const iconSizes = ["16", "32", "48", "128"];
  for (const size of iconSizes) {
    const rel = icons[size];
    if (!rel) {
      error(`Ícone ${size}×${size} ausente no manifest.`);
      continue;
    }
    const file = path.join(OUT_DIR, rel);
    if (!statSyncSafe(file)) {
      error(`Arquivo de ícone ausente: ${rel}`);
      continue;
    }
    if (!isValidPng(file)) {
      error(`Ícone ${rel} não é um PNG válido — a CWS rejeita com "Invalid icon file".`);
    }
  }

  // 6. Pontos de entrada do MV3 existem no pacote.
  const sw = manifest.background?.service_worker;
  if (!sw) {
    error("manifest sem background.service_worker.");
  } else if (!statSyncSafe(path.join(OUT_DIR, sw))) {
    error(`Service worker ausente no pacote: ${sw}`);
  }

  const popup = manifest.action?.default_popup;
  if (!popup) {
    error("manifest sem action.default_popup.");
  } else if (!statSyncSafe(path.join(OUT_DIR, popup))) {
    error(`Popup ausente no pacote: ${popup}`);
  }

  // 7. Tamanho do pacote: a CWS tem limite de 2 GB, mas um pacote gigante
  //    é sinal de que algo indevido foi bundlado.
  const total = dirSize(OUT_DIR);
  if (total > 5 * 1024 * 1024) {
    warn(`Pacote com ${(total / 1024 / 1024).toFixed(1)} MB — revise o que foi bundlado.`);
  }

  report();
}

function statSyncSafe(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function dirSize(dir: string): number {
  try {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += dirSize(full);
      else total += statSyncSafe(full) ? statSync(full).size : 0;
    }
    return total;
  } catch {
    return 0;
  }
}

function report(): void {
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");

  for (const w of warns) console.warn(`⚠️  ${w.message}`);
  for (const e of errors) console.error(`❌ ${e.message}`);

  if (errors.length > 0) {
    console.error(
      `\n❌ validate-package: ${errors.length} erro(s) — o pacote seria rejeitado na CWS.`,
    );
    process.exit(1);
  }

  console.log(
    `✅ validate-package: pacote OK (${warns.length} aviso(s)).` +
      (warns.length > 0 ? "" : " Ícones PNG válidos, permissões mínimas, hosts restritos."),
  );
}

main();
