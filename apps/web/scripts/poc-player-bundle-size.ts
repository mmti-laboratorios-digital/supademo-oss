#!/usr/bin/env -S node --experimental-strip-types
/**
 * POC-4: tamanho real do bundle @easydemo/player
 *
 * Estratégia:
 *  1) Faz `vite build` no pacote.
 *  2) Mede raw, gzip-9 e brotli-q11 de cada artefato (index.js, index.cjs, style.css).
 *  3) Soma JS+CSS (entrypoints públicos).
 *  4) Reporta também o limite da pesquisa (Supademo embed é ~50KB JS; Storylane ~80KB).
 *
 * Rodar: ./node_modules/.bin/tsx apps/web/scripts/poc-player-bundle-size.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import zlib from "node:zlib";

const PKG = "packages/player";

function buildOnce() {
  console.log("→ vite build @easydemo/player …");
  execSync("pnpm --filter @easydemo/player build", { stdio: "inherit" });
}

function brotli(b: Buffer) {
  return zlib.brotliCompressSync(b, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    },
  });
}

function reportOne(file: string) {
  const buf = readFileSync(file);
  const gz = zlib.gzipSync(buf, { level: 9 });
  const br = brotli(buf);
  return {
    file,
    raw: buf.length,
    gzip: gz.length,
    brotli: br.length,
  };
}

function main() {
  buildOnce();
  const dist = join(PKG, "dist");
  const files = readdirSync(dist).filter((f) => !f.endsWith(".map"));
  const rows = files.map((f) => reportOne(join(dist, f)));
  console.log("\n=== POC-4: @easydemo/player bundle size ===");
  console.table(
    rows.map((r) => ({
      file: r.file.replace(`${PKG}/dist/`, ""),
      "raw (B)": r.raw,
      "gzip-9 (B)": r.gzip,
      "brotli-q11 (B)": r.brotli,
    })),
  );

  // soma JS+CSS (o que vai pra CDN)
  const js = rows.find((r) => r.file.endsWith(".js") && !r.file.endsWith(".cjs"));
  const css = rows.find((r) => r.file.endsWith(".css"));
  const total = {
    raw: (js?.raw ?? 0) + (css?.raw ?? 0),
    gzip: (js?.gzip ?? 0) + (css?.gzip ?? 0),
    brotli: (js?.brotli ?? 0) + (css?.brotli ?? 0),
  };
  console.log("\nSoma JS+CSS (entrega embed):");
  console.table(total);

  const distSize = (() => {
    let s = 0;
    for (const f of readdirSync(dist)) s += statSync(join(dist, f)).size;
    return s;
  })();
  console.log(`\nTotal dist/ (com sourcemaps): ${(distSize / 1024).toFixed(1)} KB`);
}

main();
