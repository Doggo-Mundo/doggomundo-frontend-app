/**
 * Sentry browser SDK initialization.
 *
 * Opt-in via VITE_SENTRY_DSN. When the variable is empty (default in
 * local dev), Sentry stays dormant — no network calls, no overhead,
 * no tracking of dev errors.
 *
 * Source maps are uploaded by @sentry/vite-plugin during the build,
 * which only runs when SENTRY_AUTH_TOKEN is present (Vercel CI).
 */
import * as Sentry from "@sentry/react";

import { isChunkLoadError } from "./chunk-reload";

/**
 * Un chunk obsoleto tras un deploy es esperable y se auto-recupera con una
 * recarga: se baja a `info` (y se etiqueta) para que no dispare alertas ni
 * se confunda con errores reales, pero sigue siendo consultable.
 */
export function downgradeChunkLoadErrors(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const isChunkError = event.exception?.values?.some((v) => isChunkLoadError(v.value));
  if (!isChunkError) return event;
  event.level = "info";
  event.tags = { ...event.tags, chunk_load_error: "true" };
  return event;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "production",
    // Light tracing sample for performance insights without blowing up
    // the free Sentry quota.
    beforeSend: downgradeChunkLoadErrors,
    tracesSampleRate: 0.1,
    // Replays only on errors (no continuous recording).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}
