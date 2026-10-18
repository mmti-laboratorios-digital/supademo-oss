/**
 * Server-side runtime: inicializa OTel + Sentry no Node runtime.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    integrations: [],
  });
}

if (otelEndpoint) {
  // Lazy-load para não exigir @opentelemetry/* se a env não estiver configurada.
  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { Resource } = await import(
      "@opentelemetry/resources"
    );
    const { SemanticResourceAttributes } = await import(
      "@opentelemetry/semantic-conventions"
    );

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]:
          process.env.OTEL_SERVICE_NAME ?? "demobr-web",
      }),
      traceExporter: new OTLPTraceExporter({ url: `${otelEndpoint}/v1/traces` }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
  } catch {
    // OpenTelemetry não instalado — ignorar em dev local
  }
}