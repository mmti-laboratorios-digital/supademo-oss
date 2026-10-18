/**
 * Next.js instrumentation — roda 1x no boot do server (Node) e no edge.
 * Inicializa OpenTelemetry tracing + Sentry.
 *
 * Documentação: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./instrumentation.edge");
  }
}