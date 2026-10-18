/**
 * Wrapper sobre chrome.storage.session — persiste estado de captura
 * entre mortes/reinícios do service worker.
 */

import type { CapturePayload } from "./api";

export type Session = {
  capturing: boolean;
  demoId: string | null;
  steps: (CapturePayload & { screenshotR2Key?: string; status: "pending" | "uploaded" | "error" })[];
  startedAt: number;
};

const KEY = "demobr.session";

export async function getSession(): Promise<Session | null> {
  const raw = await chrome.storage.session.get(KEY);
  const s = raw[KEY] as Session | undefined;
  return s ?? null;
}

export async function setSession(session: Session): Promise<void> {
  await chrome.storage.session.set({ [KEY]: session });
}

export async function patchSession(patch: Partial<Session>): Promise<Session> {
  const current = (await getSession()) ?? {
    capturing: false,
    demoId: null,
    steps: [],
    startedAt: 0,
  };
  const next = { ...current, ...patch };
  await setSession(next);
  return next;
}

export async function clearSession(): Promise<void> {
  await chrome.storage.session.remove(KEY);
}