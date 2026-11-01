/**
 * Persistência da sessão de captura no chrome.storage.session.
 */

import type { CapturePayload } from "./api";

export type CaptureSession = {
  demoId: string;
  demoTitle: string;
  capturing?: boolean;
  startedAt?: number;
  steps: Array<
    CapturePayload & { screenshotR2Key?: string; status: "pending" | "uploaded" | "error" }
  >;
  token?: string;
};

const SESSION_KEY = "captureSession";

export async function getSession(): Promise<CaptureSession | null> {
  const res = await chrome.storage.session.get(SESSION_KEY);
  return (res[SESSION_KEY] as CaptureSession | undefined) ?? null;
}

export async function setSession(session: CaptureSession | null): Promise<void> {
  if (session) {
    await chrome.storage.session.set({ [SESSION_KEY]: session });
  } else {
    await chrome.storage.session.remove(SESSION_KEY);
  }
}

export async function patchSession(patch: Partial<CaptureSession>): Promise<void> {
  const current = await getSession();
  await setSession({ ...(current ?? { demoId: "", demoTitle: "", steps: [] }), ...patch });
}
