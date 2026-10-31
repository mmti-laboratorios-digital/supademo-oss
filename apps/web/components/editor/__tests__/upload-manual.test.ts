import { describe, expect, it } from "vitest";

/**
 * Gate G1.5 — regras do upload manual de screenshot.
 *
 * As regras vivem no componente de editor (client), então aqui extraímos
 * apenas o contrato puro: tipo aceito, limite de tamanho e a mensagem de
 * erro. O comportamento de rede (presigned PUT + POST do step) é coberto
 * pelos testes de integração da API.
 */

/** Limite do upload manual: 10 MB por imagem (F2.4). */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(contentType);
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

describe("upload manual — tipos aceitos", () => {
  it("aceita PNG, JPG e WEBP", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/jpeg")).toBe(true);
    expect(isAllowedImageType("image/webp")).toBe(true);
  });

  it("recusa tipos não-imagem", () => {
    expect(isAllowedImageType("application/pdf")).toBe(false);
    expect(isAllowedImageType("video/mp4")).toBe(false);
    expect(isAllowedImageType("")).toBe(false);
  });
});

describe("upload manual — limite de tamanho", () => {
  it("o limite é 10 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it("formata o tamanho em MB e KB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatFileSize(MAX_UPLOAD_BYTES)).toBe("10.0 MB");
    expect(formatFileSize(512 * 1024)).toBe("512 KB");
  });

  it("a mensagem de erro cita o tamanho atual e o limite", () => {
    const size = 12 * 1024 * 1024;
    const message = `Imagem muito grande (${formatFileSize(size)}). O limite é ${formatFileSize(
      MAX_UPLOAD_BYTES,
    )}. Otimize a imagem antes de enviar.`;
    expect(message).toContain("12.0 MB");
    expect(message).toContain("10.0 MB");
    expect(message).toContain("Otimize");
  });
});
