import type { Task } from "graphile-worker";

/**
 * tts_job — gera narração TTS pt-BR para um step.
 *
 * Provider: ElevenLabs (qualidade) ou Cartesia (custo).
 * Áudio é cacheado em R2 (`demos/{demoId}/steps/{stepId}.mp3`).
 */
export const ttsJob: Task = async (rawPayload) => {
  const payload = rawPayload as { stepId: string; text: string; lang: "pt-BR" | "en" };
  const { stepId, text, lang } = payload;

  if (!process.env.ELEVENLABS_API_KEY && !process.env.CARTESIA_API_KEY) {
    console.warn(`[tts_job] stepId=${stepId} — nenhum provider configurado; skip`);
    return;
  }

  // Implementação real chamaria ElevenLabs /v1/text-to-speech/<voice_id>
  // com body { text, model_id: 'eleven_multilingual_v2' } e gravaria o MP3
  // retornado em R2.
  console.log(`[tts_job] stepId=${stepId} lang=${lang} chars=${text.length}`);
};
