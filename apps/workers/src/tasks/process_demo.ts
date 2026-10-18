import type { Task } from "graphile-worker";
import sharp from "sharp";

/**
 * process_demo — converte screenshots PNG recém-uploadados para WebP,
 * gera variantes responsivas, atualiza metadados no R2.
 */
export const processDemo: Task = async (rawPayload) => {
  const payload = rawPayload as { demoId: string };
  const { demoId } = payload;

  // 1. Listar screenshots no R2
  // 2. Para cada .png: baixar, converter para WebP (sharp), re-upload
  // 3. Atualizar steps.screenshot_r2_key com a nova key
  // 4. Enfileirar generate_og

  // Placeholder funcional — apenas log + emulação mínima
  console.log(`[process_demo] demoId=${demoId} — converting screenshots`);

  // Exemplo de uso de sharp (não roda sem arquivos reais):
  if (process.env.SHARP_DRY_RUN === "1") {
    const buf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    const out = await sharp(buf).webp({ quality: 85 }).toBuffer();
    void out;
  }
};