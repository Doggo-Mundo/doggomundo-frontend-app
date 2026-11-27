/**
 * ¿Estamos en un ambiente de pruebas (staging)?
 *
 * Dos señales, basta una:
 * - `VITE_SENTRY_ENVIRONMENT=staging` (ya se configura por ambiente).
 * - El dominio contiene "staging" (staging.app.doggomundo.com.mx,
 *   *-staging.up.railway.app): funciona aunque falte la variable.
 *
 * Producción no cumple ninguna, así que ahí no se muestra nada.
 */
export function isTestEnvironment(
  env: string | undefined = import.meta.env.VITE_SENTRY_ENVIRONMENT,
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  if (env?.toLowerCase() === "staging") return true;
  return hostname.toLowerCase().includes("staging");
}

export const TEST_TITLE_PREFIX = "[PRUEBAS] ";

/** Antepone "[PRUEBAS]" al título de la pestaña en staging. */
export function applyEnvironmentTitle(
  doc: Document = document,
  isTest: boolean = isTestEnvironment(),
): void {
  if (isTest && !doc.title.startsWith(TEST_TITLE_PREFIX)) {
    doc.title = `${TEST_TITLE_PREFIX}${doc.title}`;
  }
}

/** Llave publicable de Stripe en modo prueba (`pk_test_…`). */
export function isStripeTestMode(
  key: string | undefined = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
): boolean {
  return Boolean(key?.startsWith("pk_test_"));
}
