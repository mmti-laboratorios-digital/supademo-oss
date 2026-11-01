/**
 * apps/extension/scripts/generate-icons.ts
 * -----------------------------------------------------------------------------
 * Gera os ícones PNG reais da extensão Chrome a partir do favicon.svg da marca.
 *
 * ⚠️ Os arquivos em `public/icons/` eram **placeholders de texto** — a Chrome
 * Web Store rejeita a extensão com "Invalid icon file". Este script regenera
 * PNGs válidos (16/32/48/128 px) a partir de `online-presence/brand/favicon.svg`.
 *
 * Uso:
 *   pnpm --filter extension exec tsx scripts/generate-icons.ts
 *
 * Dependência: `sharp` (já presente no monorepo em apps/web).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = resolve(HERE, "..");
const REPO_ROOT = resolve(EXT_ROOT, "../..");

const SVG_PATH = resolve(REPO_ROOT, "online-presence/brand/favicon.svg");
const OUT_DIR = resolve(EXT_ROOT, "public/icons");

const SIZES = [16, 32, 48, 128] as const;

async function main(): Promise<void> {
  const svg = readFileSync(SVG_PATH);

  for (const size of SIZES) {
    const out = resolve(OUT_DIR, `icon-${size}.png`);
    const buf = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeFileSync(out, buf);
    console.log(`✓ icon-${size}.png (${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
