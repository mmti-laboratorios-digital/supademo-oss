/**
 * apps/web/lib/__tests__/r2-presigned.test.ts
 *
 * Testes determinísticos que mockam presignPut() — sem rede AWS.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do lib/r2.ts antes do import
vi.mock("../r2", () => ({
  presignPut: vi.fn(async (args: { key: string; contentType: string; expiresInSeconds?: number; bucket: string }) => ({
    url: `https://r2.example.com/${args.bucket}/${args.key}?X-Amz-Signature=fake&X-Amz-Expires=${args.expiresInSeconds ?? 600}`,
    key: args.key,
    bucket: args.bucket,
  })),
}));

import { signUploadUrl, buildKey } from "../r2-presigned";
import { presignPut } from "../r2";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signUploadUrl", () => {
  it("retorna URL com Content-Type e key bem formado", async () => {
    const out = await signUploadUrl({
      demoId: "demo-abc",
      stepId: "step-xyz",
      filename: "screenshot.webp",
      contentType: "image/webp",
    });
    expect(out.key).toBe("demos/demo-abc/steps/step-xyz/screenshot.webp");
    expect(out.url).toContain("demos/demo-abc/steps/step-xyz/screenshot.webp");
    // No mock, bucket é o nome curto passado ao presignPut
    expect(out.bucket).toBe("public");
    expect(presignPut).toHaveBeenCalledOnce();
    const call = vi.mocked(presignPut).mock.calls[0][0];
    expect(call.contentType).toBe("image/webp");
  });

  it("erro se contentType inválido", async () => {
    await expect(
      signUploadUrl({
        demoId: "demo-abc",
        stepId: "step-xyz",
        filename: "foo.exe",
        contentType: "application/x-msdownload",
      }),
    ).rejects.toThrow(/contentType not allowed/i);
    expect(presignPut).not.toHaveBeenCalled();
  });

  it("respeita expiresInSeconds customizado", async () => {
    await signUploadUrl({
      demoId: "d",
      stepId: "s",
      filename: "x.png",
      contentType: "image/png",
      expiresInSeconds: 120,
    });
    expect(vi.mocked(presignPut).mock.calls[0][0].expiresInSeconds).toBe(120);
  });

  it("default expiresInSeconds é 600 (10 min)", async () => {
    await signUploadUrl({
      demoId: "d",
      stepId: "s",
      filename: "x.png",
      contentType: "image/png",
    });
    expect(vi.mocked(presignPut).mock.calls[0][0].expiresInSeconds).toBe(600);
  });

  it("sanitiza filename — só basename + extensão forçada por contentType", async () => {
    const out = await signUploadUrl({
      demoId: "d1",
      stepId: "s1",
      filename: "../../etc/passwd.png",
      contentType: "image/png",
    });
    // Passa pelo basename que vira "passwd" e a extensão volta via contentType
    expect(out.key).toBe("demos/d1/steps/s1/passwd.png");
  });

  it("erro em filename com caracteres inválidos", async () => {
    await expect(
      signUploadUrl({
        demoId: "d1",
        stepId: "s1",
        filename: "Olá mundo!.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow(/invalid filename/i);
  });

  it("erro se demoId ou stepId ausentes", async () => {
    await expect(
      signUploadUrl({
        demoId: "",
        stepId: "s1",
        filename: "x.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow(/demoId required/i);

    await expect(
      signUploadUrl({
        demoId: "d1",
        stepId: "",
        filename: "x.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow(/stepId required/i);
  });
});

describe("buildKey", () => {
  it("formata demos/{id}/steps/{id}.{ext}", () => {
    expect(buildKey("abc", "xyz", "foo.webp")).toBe(
      "demos/abc/steps/xyz/foo.webp",
    );
  });
});