/**
 * apps/web/vitest.globalSetup.ts
 * -----------------------------------------------------------------------------
 * Vitest globalSetup — sobe o mock Asaas UMA VEZ antes do run de testes e
 * desliga ao final. Disponibiliza a URL via env `MOCK_ASAAS_URL` para os
 * tests individuais.
 *
 * Quando o test chama `import.meta.vitest` config ou `process.env.MOCK_ASAAS_URL`,
 * aponta para http://127.0.0.1:${port}.
 */
import { startMockAsaas } from "./scripts/mock-asaas";

export default async function setup(): Promise<() => Promise<void>> {
  const port = Number(process.env.MOCK_ASAAS_PORT ?? 65500);

  const server = await startMockAsaas({ port, silent: true });

  // Disponibiliza via process.env, que é o jeito mais fácil dos tests consumirem.
  process.env.MOCK_ASAAS_URL = server.url;
  process.env.MOCK_ASAAS_PORT = String(server.port);

  // Encerramento limpo ao final do run
  return async () => {
    await server.stop();
  };
}
