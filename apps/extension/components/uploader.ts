/**
 * Uploader — finaliza uma sessão de captura criando steps no servidor.
 *
 * Para cada step já com screenshotR2Key:
 *   POST /api/v1/demos/{demoId}/steps
 *   body: { position, screenshotR2Key, sourceUrl, sourceTitle, hotspot, caption }
 */

import { getApi } from "../lib/api";
import { getSession } from "../lib/store";
import type { StoredStep } from "./recorder";

export type UploadResult = {
  uploaded: number;
  failed: number;
  errors: string[];
};

export async function uploadQueue(
  demoId: string,
  steps: StoredStep[],
): Promise<UploadResult> {
  const api = getApi();
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

    const x = Math.round(s.boundingRect.x);
    const y = Math.round(s.boundingRect.y);
    const hotspot = {
      type: "pointer" as const,
      x: clampPercent(x),
      y: clampPercent(y),
    };

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

  void getSession; // marcador — função mantida para consistência futura
  return { uploaded, failed, errors };
}

function clampPercent(px: number): number {
  // Sem acesso ao viewport aqui — clampa em 0..100 sem normalizar.
  // A normalização (% da viewport) acontece no SW.
  return Math.max(0, Math.min(100, Math.round((px / Math.max(1, window.innerWidth)) * 100)));
}