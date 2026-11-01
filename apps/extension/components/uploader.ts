/**
 * Uploader — finaliza uma sessão de captura criando steps no servidor.
 *
 * Para cada step já com screenshotR2Key:
 *   POST /api/v1/demos/{demoId}/steps
 *   body: { position, screenshotR2Key, sourceUrl, sourceTitle, hotspot, caption }
 */

import { pixelsToHotspot } from "@easydemo/shared/capture/hotspot";
import { getApi } from "../lib/api";
import type { StoredStep } from "./recorder";

export type UploadResult = {
  uploaded: number;
  failed: number;
  errors: string[];
};

export async function uploadQueue(
  demoId: string,
  steps: StoredStep[],
  token: string | null,
): Promise<UploadResult> {
  const api = getApi(undefined, token);
  let uploaded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s) continue;
    if (!s.screenshotR2Key) {
      failed++;
      errors.push(`step ${i + 1}: sem screenshot`);
      continue;
    }

    const viewport = s.viewport ?? { width: 1920, height: 1080 };
    const hotspot = pixelsToHotspot(s.boundingRect, viewport, "pointer");

    const result = await api.createStep({
      demoId,
      position: i + 1,
      screenshotR2Key: s.screenshotR2Key,
      sourceUrl: s.pageUrl,
      sourceTitle: s.pageTitle,
      caption: s.elementText.slice(0, 200),
      hotspot,
    });

    if (result) uploaded++;
    else {
      failed++;
      errors.push(`step ${i + 1}: createStep failed`);
    }
  }

  return { uploaded, failed, errors };
}
