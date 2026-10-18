/**
 * apps/web/scripts/create-test-images.ts
 *
 * Gera PNGs sintéticos 1280x720 para uso em testes (seed + OCR pipeline).
 *
 * Saída:
 *   ./test-fixtures/images/step-{1,2,3}.png
 *   ./test-fixtures/images/cover.png
 *   ./test-fixtures/pdfs/fake-cpf-screenshot.png   (com CPF em texto)
 *
 * Uso:
 *   pnpm --filter web exec tsx scripts/create-test-images.ts
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "./test-fixtures");
const IMG_DIR = resolve(OUT_DIR, "images");
const PDF_DIR = resolve(OUT_DIR, "pdfs");

const W = 1280;
const H = 720;

/**
 * Gera SVG com texto renderizado — convertido para PNG via sharp.
 * PII aparece como texto na imagem para o pipeline de OCR/redact.
 */
function svg(opts: {
  bg: string;
  title: string;
  subtitle?: string;
  piiText?: string;
}): string {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${opts.bg}"/>
    <text x="60" y="80" font-family="sans-serif" font-size="48" font-weight="bold" fill="#111">
      ${opts.title}
    </text>
    ${
      opts.subtitle
        ? `<text x="60" y="140" font-family="sans-serif" font-size="28" fill="#333">${opts.subtitle}</text>`
        : ""
    }
    ${
      opts.piiText
        ? `<text x="60" y="${H - 60}" font-family="monospace" font-size="24" fill="#900">${opts.piiText}</text>`
        : ""
    }
  </svg>`;
}

async function svgToPng(svgStr: string): Promise<Buffer> {
  return await sharp(Buffer.from(svgStr)).png().toBuffer();
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(PDF_DIR, { recursive: true });

  console.log("▶ Gerando PNGs sintéticos 1280x720…");

  const images: Array<{ name: string; svg: string }> = [
    {
      name: "cover.png",
      svg: svg({
        bg: "#fef3c7",
        title: "Demo de teste — Capa",
        subtitle: "Bem-vindo à demo de exemplo (fixture E2E)",
      }),
    },
    {
      name: "step-1.png",
      svg: svg({
        bg: "#dbeafe",
        title: "Step 1 — Dashboard",
        subtitle: "Visão geral da sua conta",
      }),
    },
    {
      name: "step-2.png",
      svg: svg({
        bg: "#dcfce7",
        title: "Step 2 — Recursos",
        subtitle: "Conheça os principais recursos",
      }),
    },
    {
      name: "step-3.png",
      svg: svg({
        bg: "#fce7f3",
        title: "Step 3 — Preços",
        subtitle: "Plano Pro: R$ 49/mês",
      }),
    },
    {
      name: "fake-cpf-screenshot.png",
      svg: svg({
        bg: "#f4f4f5",
        title: "Perfil do Cliente",
        subtitle: "Dados sensíveis para teste de redaction",
        piiText: "CPF: 123.456.789-09  Email: teste@example.com  Cartão: 4111 1111 1111 1111",
      }),
    },
  ];

  for (const { name, svg: svgContent } of images) {
    const buf = await svgToPng(svgContent);
    const outDir = name.startsWith("fake-cpf") ? PDF_DIR : IMG_DIR;
    const outPath = resolve(outDir, name);
    await writeFile(outPath, buf);
    console.log(`  ✓ ${outPath} (${buf.length} bytes)`);
  }

  // Metadata JSON
  const meta = {
    generatedAt: new Date().toISOString(),
    width: W,
    height: H,
    files: images.map((i) => i.name),
  };
  await writeFile(
    resolve(OUT_DIR, "manifest.json"),
    JSON.stringify(meta, null, 2),
  );
  console.log(`  ✓ ${resolve(OUT_DIR, "manifest.json")}`);

  console.log("\n✅ Imagens de teste geradas em ./test-fixtures/");
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});