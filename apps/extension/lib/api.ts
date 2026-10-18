/**
 * Wrapper fetch para a API da aplicação.
 * - Adiciona Authorization (Clerk session token via chrome.identity)
 * - Trata erros com mensagens amigáveis
 */

export type CapturePayload = {
  elementTag: string;
  elementSelector: string;
  elementText: string;
  boundingRect: { x: number; y: number; width: number; height: number };
  pageUrl: string;
  pageTitle: string;
  timestamp: number;
};

export type DemoSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
};

export type MeResponse = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
};

export class ApiClient {
  constructor(public readonly baseUrl: string) {}

  private async authHeaders(): Promise<Record<string, string>> {
    // Em produção, pegar token Clerk via cookies httpOnly.
    // Aqui, simplificado: a API valida via cookie de sessão.
    return {};
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = {
      "content-type": "application/json",
      accept: "application/json",
      ...(await this.authHeaders()),
      ...(init.headers ?? {}),
    };
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  async getMe(): Promise<MeResponse | null> {
    try {
      return await this.request<MeResponse>("/me");
    } catch {
      return null;
    }
  }

  async createDemo(args: { title: string; slug?: string }): Promise<DemoSummary | null> {
    try {
      const slug =
        args.slug ??
        args.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 32) +
          "-" +
          Math.random().toString(36).slice(2, 6);
      const res = await this.request<{ demo: DemoSummary }>("/demos", {
        method: "POST",
        body: JSON.stringify({
          title: args.title,
          slug,
          language: "pt-BR",
        }),
      });
      return res.demo;
    } catch {
      return null;
    }
  }

  async presignUpload(args: {
    key: string;
    contentType: string;
  }): Promise<{ url: string; key: string } | null> {
    try {
      return await this.request<{ url: string; key: string }>("/upload/sign", {
        method: "POST",
        body: JSON.stringify({
          bucket: "public",
          key: args.key,
          contentType: args.contentType,
          expiresInSeconds: 600,
        }),
      });
    } catch {
      return null;
    }
  }

  async createStep(args: {
    demoId: string;
    position: number;
    screenshotR2Key: string;
    sourceUrl: string;
    sourceTitle: string;
    caption?: string;
    hotspot: { type: "pointer" | "callout" | "area"; x: number; y: number };
  }): Promise<{ id: string } | null> {
    try {
      const res = await this.request<{ step: { id: string } }>(
        `/demos/${args.demoId}/steps`,
        {
          method: "POST",
          body: JSON.stringify(args),
        },
      );
      return { id: res.step.id };
    } catch {
      return null;
    }
  }

  async putToR2(presignedUrl: string, blob: Blob): Promise<boolean> {
    try {
      const res = await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: { "content-type": blob.type },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

const DEFAULT_BASE = "http://localhost:3000/api/v1";

export function getApi(baseUrl: string = DEFAULT_BASE): ApiClient {
  return new ApiClient(baseUrl);
}