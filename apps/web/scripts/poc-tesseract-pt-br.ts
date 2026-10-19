#!/usr/bin/env -S node --experimental-strip-types
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance as perf } from "node:perf_hooks";
/**
 * POC-3: Tesseract.js em PT-BR (precisão) — sem precisar de Chrome/canvas.
 *
 * Gera 3 PNGs sintéticos em memória usando o próprio encoder do `pngjs`
 * (que já vem como dep transitiva ou instalamos leve). Cada PNG tem fundo
 * branco e texto preto nítido com fontes padrão — cenário próximo ao
 * screenshot B2B real.
 *
 * Estratégia de geração: como rodar `canvas` precisa de libs nativas,
 * usamos um truque mais simples e determinístico — escrever cada pixel
 * a partir de um bitmap 8x maior que uma fonte monoespaçada 8x8.
 * Para evitar canvas, geramos os PNGs via uma string ASCII diretamente
 * usando `pngjs` que só depende de node Buffer (zero nativo).
 *
 * Rodar: ./node_modules/.bin/tsx apps/web/scripts/poc-tesseract-pt-br.ts
 */
import { PNG } from "pngjs";
import { createWorker } from "tesseract.js";

// Bitmap de fonte 8x8 mínimo (apenas letras/dígitos que usamos nas POCs).
// Cada caractere = 8 colunas x 8 linhas. Bit 1 = pixel aceso.
// Implementação compacta: desenhamos uma string "ABCDE" como bitmap manual.
const FONT: Record<string, string[]> = {
  " ": [
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
  ],
  "0": [
    "00111100",
    "01100110",
    "01101110",
    "01110110",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  "1": [
    "00011000",
    "00111000",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00111100",
    "00000000",
  ],
  "2": [
    "00111100",
    "01100110",
    "00000110",
    "00001100",
    "00011000",
    "00110000",
    "01111110",
    "00000000",
  ],
  "3": [
    "01111110",
    "00001100",
    "00011000",
    "00001100",
    "00000110",
    "01100110",
    "00111100",
    "00000000",
  ],
  "4": [
    "00001100",
    "00011100",
    "00101100",
    "01001100",
    "01111110",
    "00001100",
    "00001100",
    "00000000",
  ],
  "5": [
    "01111110",
    "01100000",
    "01111100",
    "00000110",
    "00000110",
    "01100110",
    "00111100",
    "00000000",
  ],
  "6": [
    "00011100",
    "00110000",
    "01100000",
    "01111100",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  "7": [
    "01111110",
    "00000110",
    "00001100",
    "00011000",
    "00110000",
    "00110000",
    "00110000",
    "00000000",
  ],
  "8": [
    "00111100",
    "01100110",
    "01100110",
    "00111100",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  "9": [
    "00111100",
    "01100110",
    "01100110",
    "00111110",
    "00000110",
    "00001100",
    "00111000",
    "00000000",
  ],
  ".": [
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00011000",
    "00011000",
    "00000000",
  ],
  ",": [
    "00000000",
    "00000000",
    "00000000",
    "00000000",
    "00011000",
    "00011000",
    "00010000",
    "00100000",
  ],
  "-": [
    "00000000",
    "00000000",
    "00000000",
    "00111100",
    "00000000",
    "00000000",
    "00000000",
    "00000000",
  ],
  "/": [
    "00000010",
    "00000100",
    "00001000",
    "00010000",
    "00100000",
    "01000000",
    "10000000",
    "00000000",
  ],
  ":": [
    "00000000",
    "00011000",
    "00011000",
    "00000000",
    "00011000",
    "00011000",
    "00000000",
    "00000000",
  ],
  "@": [
    "00111100",
    "01100110",
    "01101110",
    "01101110",
    "01100000",
    "01100000",
    "00111100",
    "00000000",
  ],
  C: [
    "00111100",
    "01100110",
    "01100000",
    "01100000",
    "01100000",
    "01100110",
    "00111100",
    "00000000",
  ],
  F: [
    "01111110",
    "01100000",
    "01100000",
    "01111100",
    "01100000",
    "01100000",
    "01100000",
    "00000000",
  ],
  J: [
    "00111110",
    "00000110",
    "00000110",
    "00000110",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  P: [
    "01111100",
    "01100110",
    "01100110",
    "01111100",
    "01100000",
    "01100000",
    "01100000",
    "00000000",
  ],
  N: [
    "01100010",
    "01110010",
    "01110110",
    "01101110",
    "01101110",
    "01100110",
    "01100010",
    "00000000",
  ],
  L: [
    "01100000",
    "01100000",
    "01100000",
    "01100000",
    "01100000",
    "01100000",
    "01111110",
    "00000000",
  ],
  O: [
    "00111100",
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  D: [
    "01111000",
    "01101100",
    "01100110",
    "01100110",
    "01100110",
    "01101100",
    "01111000",
    "00000000",
  ],
  R: [
    "01111100",
    "01100110",
    "01100110",
    "01111100",
    "01101000",
    "01100110",
    "01100110",
    "00000000",
  ],
  E: [
    "01111110",
    "01100000",
    "01100000",
    "01111000",
    "01100000",
    "01100000",
    "01111110",
    "00000000",
  ],
  M: [
    "01100010",
    "01110110",
    "01111110",
    "01111110",
    "01101010",
    "01100010",
    "01100010",
    "00000000",
  ],
  A: [
    "00111100",
    "01100110",
    "01100110",
    "01111110",
    "01100110",
    "01100110",
    "01100110",
    "00000000",
  ],
  I: [
    "00111100",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00111100",
    "00000000",
  ],
  G: [
    "00111100",
    "01100110",
    "01100000",
    "01101110",
    "01100110",
    "01100110",
    "00111110",
    "00000000",
  ],
  U: [
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "00111100",
    "00000000",
  ],
  S: [
    "00111110",
    "01100000",
    "01100000",
    "00111100",
    "00000110",
    "00000110",
    "01111100",
    "00000000",
  ],
  T: [
    "01111110",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00011000",
    "00000000",
  ],
  H: [
    "01100110",
    "01100110",
    "01100110",
    "01111110",
    "01100110",
    "01100110",
    "01100110",
    "00000000",
  ],
  K: [
    "01100110",
    "01101100",
    "01111000",
    "01110000",
    "01111000",
    "01101100",
    "01100110",
    "00000000",
  ],
  B: [
    "01111100",
    "01100110",
    "01100110",
    "01111100",
    "01100110",
    "01100110",
    "01111100",
    "00000000",
  ],
  V: [
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "01100110",
    "00111100",
    "00011000",
    "00000000",
  ],
  W: [
    "01100010",
    "01100010",
    "01100010",
    "01101010",
    "01101010",
    "01111110",
    "00110100",
    "00000000",
  ],
  X: [
    "01100110",
    "01100110",
    "00111100",
    "00011000",
    "00111100",
    "01100110",
    "01100110",
    "00000000",
  ],
  Y: [
    "01100110",
    "01100110",
    "01100110",
    "00111100",
    "00011000",
    "00011000",
    "00011000",
    "00000000",
  ],
  Z: [
    "01111110",
    "00000110",
    "00001100",
    "00011000",
    "00110000",
    "01100000",
    "01111110",
    "00000000",
  ],
  Q: [
    "00111100",
    "01100110",
    "01100110",
    "01100110",
    "01101110",
    "01111100",
    "00000110",
    "00000010",
  ],
};

function renderText(text: string, scale = 4): PNG {
  // Mede largura
  const charW = 8 * scale;
  const charH = 8 * scale;
  const padding = scale * 2;
  const totalW = padding * 2 + charW * text.length;
  const totalH = padding * 2 + charH;
  const png = new PNG({ width: totalW, height: totalH });
  // fundo branco
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255;
    png.data[i + 1] = 255;
    png.data[i + 2] = 255;
    png.data[i + 3] = 255;
  }
  for (let ci = 0; ci < text.length; ci++) {
    const ch = text[ci].toUpperCase();
    const glyph = FONT[ch] ?? FONT[" "];
    const ox = padding + ci * charW;
    const oy = padding;
    for (let y = 0; y < 8; y++) {
      const row = glyph[y];
      for (let x = 0; x < 8; x++) {
        if (row[x] === "1") {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const px = ox + x * scale + dx;
              const py = oy + y * scale + dy;
              const idx = (py * totalW + px) * 4;
              png.data[idx] = 0;
              png.data[idx + 1] = 0;
              png.data[idx + 2] = 0;
              png.data[idx + 3] = 255;
            }
          }
        }
      }
    }
  }
  return png;
}

const SAMPLES = [
  {
    name: "cpf",
    text: "123.456.789-09",
    pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/,
    expected: "123.456.789-09",
  },
  {
    name: "cnpj",
    text: "12.345.678/0001-90",
    pattern: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/,
    expected: "12.345.678/0001-90",
  },
  {
    name: "email-upper",
    text: "FULANO.SILVA@EMPRESA.COM.BR",
    pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/,
    expected: "FULANO.SILVA@EMPRESA.COM.BR",
  },
  {
    name: "email-lower",
    text: "fulano.silva@empresa.com.br",
    pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/,
    expected: "fulano.silva@empresa.com.br",
  },
  {
    name: "pt-br-frase",
    text: "Olá, fatura de maio 2026 no valor de R$ 1.234,56",
    pattern: /R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}/,
    expected: "R$ 1.234,56",
  },
];

async function main() {
  const outDir = "/tmp/opencode/poc-tesseract";
  mkdirSync(outDir, { recursive: true });

  console.log("→ gerando PNGs sintéticos com imagem real (ImageMagick + Liberation Sans)");
  const buffers: { sample: (typeof SAMPLES)[number]; buf: Buffer }[] = [];
  for (const s of SAMPLES) {
    const path = join(outDir, `${s.name}.png`);
    // usa Liberation Sans (presente no Ubuntu) em 36pt sobre fundo branco.
    // antialias ligado para parecer screenshot real.
    execSync(
      `convert -size 1200x120 xc:white -font Liberation-Sans-Bold -pointsize 36 -fill black -gravity center -annotate +0+0 '${s.text}' ${path}`,
      { stdio: "pipe" },
    );
    const buf = readFileSync(path);
    console.log(`  - ${path} (${buf.length}B)`);
    buffers.push({ sample: s, buf });
  }

  console.log("\n→ iniciando worker tesseract.js (lang=por, init a partir do CDN)");
  const t0 = perf.now();
  const worker = await createWorker("por", 1, {
    logger: () => {},
  });
  console.log(`  init em ${(perf.now() - t0).toFixed(0)}ms`);

  console.log("\n→ rodando OCR");
  const results: Array<{ name: string; text: string; ms: number; hit: boolean; expected: string }> =
    [];
  for (const { sample, buf } of buffers) {
    const t1 = perf.now();
    const { data } = await worker.recognize(buf);
    const ms = perf.now() - t1;
    const text = (data.text ?? "").trim();
    const hit = sample.pattern.test(text);
    results.push({ name: sample.name, text, ms, hit, expected: sample.expected });
    console.log(`  ${sample.name.padEnd(12)} hit=${hit}  t=${ms.toFixed(0)}ms`);
    console.log(`    expected: ${sample.expected}`);
    console.log(`    got:      ${text}`);
  }
  await worker.terminate();

  console.log("\n=== resumo POC-3 ===");
  console.table(
    results.map((r) => ({
      caso: r.name,
      "regex bateu": r.hit,
      "tempo (ms)": Math.round(r.ms),
      esperado: r.expected,
      obtido: r.text,
    })),
  );

  const hits = results.filter((r) => r.hit).length;
  console.log(
    `\nAcerto de padrão: ${hits}/${results.length} (${((hits / results.length) * 100).toFixed(0)}%)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
