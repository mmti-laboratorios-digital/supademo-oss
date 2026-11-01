/**
 * apps/workers/vitest.setup.ts
 *
 * Carrega as variáveis de ambiente antes de qualquer import que leia
 * `process.env` (a conexão do Postgres, no caso).
 *
 * ⚠️ O worker roda de `apps/workers`, mas o `.env` mora na **raiz** do
 * monorepo — daí o fallback `../../.env`. Sem isso, os testes de integração
 * falham com `password authentication failed` porque caem no default
 * hardcoded (`app_owner:easydemo@127.0.0.1:55432`) com a senha errada.
 *
 * Espelha `apps/web/vitest.setup.ts`.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), "../../.env"));

(process.env as Record<string, string | undefined>)["NODE_ENV"] ??= "test";
