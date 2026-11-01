/**
 * Orquestrador de captura — chamado pelo service worker.
 *
 * Fluxo por step:
 *   1. chrome.tabs.captureVisibleTab → PNG blob base64
 *   2. POST /api/v1/upload/sign → presigned PUT URL
 *   3. PUT screenshot para R2
 *   4. Salva no chrome.storage.session com screenshotR2Key
 */

import { getApi } from "../lib/api";
import type { CapturePayload } from "../lib/api";
import { getSession, patchSession } from "../lib/store";

export type StoredStep = CapturePayload & {
  screenshotR2Key?: string;
  status: "pending" | "uploaded" | "error";
};

export async function captureAndStoreStep(
  tabId: number,
  payload: CapturePayload,
  token: string | null,
): Promise<StoredStep | null> {
  const api = getApi(undefined, token);
  const session = await getSession();
  if (!session?.demoId) return null;

  let screenshotR2Key: string | undefined;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tabId, { format: "png" });
    const blob = await (await fetch(dataUrl)).blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const position = session.steps.length + 1;
    const ext = "png";
    const key = `demos/${session.demoId}/steps/${position}-${Date.now()}.${ext}`;

    const presigned = await api.presignUpload({
      key,
      contentType: `image/${ext}`,
    });
    if (!presigned) throw new Error("presign failed");

    // PUT binary direto para R2
    const ok = await fetch(presigned.url, {
      method: "PUT",
      body: bytes,
      headers: { "content-type": `image/${ext}` },
    });
    if (!ok.ok) throw new Error(`R2 upload ${ok.status}`);
    screenshotR2Key = presigned.key;
  } catch (err) {
    console.warn("capture step failed (screenshot):", err);
  }

  const stored: StoredStep = {
    ...payload,
    screenshotR2Key,
    status: screenshotR2Key ? "uploaded" : "error",
  };

  await patchSession({
    steps: [...(session.steps ?? []), stored],
  });

  return stored;
}
