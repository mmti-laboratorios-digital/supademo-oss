/**
 * apps/web/lib/r2-presigned.ts
 *
 * Helpers de alto nível para presigned URLs — sobre o lib/r2.ts.
 *
 * Testável sem AWS SDK em mock — usamos o signUploadUrl wrapper que
 * valida inputs antes de delegar a `presignPut`.
 */
import { presignPut } from "./r2";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/avif",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "application/pdf",
  "video/mp4",
  "video/webm",
]);

/**
 * Valida contentType e gera URL presigned para upload.
 * Lança erro se tipo não permitido ou input malformado.
 */
export async function signUploadUrl(args: {
  demoId: string;
  stepId: string;
  filename: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; key: string; bucket: string }> {
  // Validação de IDs
  if (!args.demoId || args.demoId.length < 1) {
    throw new Error("demoId required");
  }
  if (!args.stepId || args.stepId.length < 1) {
    throw new Error("stepId required");
  }
  // Validação de contentType (anti-path-traversal via header)
  if (!ALLOWED_CONTENT_TYPES.has(args.contentType)) {
    throw new Error(
      `contentType not allowed: ${args.contentType}. Use um dos: ${Array.from(ALLOWED_CONTENT_TYPES).join(", ")}`,
    );
  }

  // Filename sanitization — apenas basename, sem extensão
  const base = args.filename
    .replace(/^.*[/\\]/, "")
    .replace(/\.[^.]+$/, "")
    .toLowerCase();
  if (!base || !/^[a-z0-9-]+$/.test(base)) {
    throw new Error(`invalid filename (deve ser [a-z0-9-]): ${args.filename}`);
  }

  const key = buildKey(args.demoId, args.stepId, `${base}.${extFromContentType(args.contentType)}`);

  return presignPut({
    bucket: "public",
    key,
    contentType: args.contentType,
    expiresInSeconds: args.expiresInSeconds ?? 600,
  });
}

/**
 * Constrói chave R2 padronizada: demos/{demoId}/steps/{stepId}.{ext}
 */
export function buildKey(demoId: string, stepId: string, filename: string): string {
  return `demos/${demoId}/steps/${stepId}/${filename}`;
}

function extFromContentType(ct: string): string {
  switch (ct) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/avif":
      return "avif";
    case "audio/mpeg":
      return "mp3";
    case "audio/mp4":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
    case "application/pdf":
      return "pdf";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

export const _internal = {
  ALLOWED_CONTENT_TYPES,
  extFromContentType,
};
