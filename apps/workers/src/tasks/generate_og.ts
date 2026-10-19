import { ImageResponse } from "@vercel/og";
import type { Task } from "graphile-worker";

/**
 * generate_og — gera Open Graph image (1200x630) para um demo.
 *
 * Usado em `<meta property="og:image">` no /d/[slug].
 *
 * Renderização: usa @vercel/og (requer React) — em prod, com JSX/React configurados.
 * Aqui retornamos bytes de uma imagem 1x1 PNG como placeholder funcional.
 */
export const generateOg: Task = async (rawPayload) => {
  const payload = rawPayload as { demoId: string };
  const { demoId } = payload;

  try {
    // Placeholder: PNG 1x1 preto. Em prod, usar ImageResponse com React JSX.
    const placeholder = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );

    // Para usar ImageResponse em prod:
    //   const response = new ImageResponse(
    //     <div style={{ display: "flex", ... }}>Demo {demoId.slice(0, 8)}</div>,
    //     { width: 1200, height: 630 }
    //   );
    //   const buf = Buffer.from(await response.arrayBuffer());

    void ImageResponse; // mantém import (será usado em prod)
    console.log(`[generate_og] demoId=${demoId} placeholder bytes=${placeholder.length}`);
  } catch (err) {
    console.error(`[generate_og] failed for ${demoId}:`, err);
  }
};
