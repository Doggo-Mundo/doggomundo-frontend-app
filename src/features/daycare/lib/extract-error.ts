import axios from "axios";

/**
 * Extract a user-facing error message from a Day Care API failure.
 *
 * The backend returns Spanish messages ready to display, in one of:
 *  - `{ error: "..." }` (action endpoints like /cancel/, /check-in/)
 *  - `{ detail: "..." }` (DRF default)
 *  - `{ non_field_errors: ["..."] }`
 *  - `{ <field>: ["..."] | "..." }` (field-level validation)
 *
 * Returns the first message it finds, with a sensible fallback.
 */
export function extractDaycareError(
  err: unknown,
  fallback = "Algo salió mal. Intenta de nuevo.",
): string {
  if (!axios.isAxiosError(err)) return fallback;

  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, string[] | string | undefined>;

  // Prefer summary keys first
  for (const key of ["error", "detail", "non_field_errors"]) {
    const val = record[key];
    if (val) return Array.isArray(val) ? String(val[0]) : String(val);
  }

  // Field-level — pick the first one
  const firstKey = Object.keys(record)[0];
  if (firstKey) {
    const val = record[firstKey];
    if (val) return Array.isArray(val) ? String(val[0]) : String(val);
  }

  return fallback;
}

/**
 * Field-by-field error map for forms. Returns an object keyed by field name
 * with the first message. Skips summary keys (`error`, `detail`,
 * `non_field_errors`) — those should go to a banner via `extractDaycareError`.
 */
export function extractDaycareFieldErrors(
  err: unknown,
): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const data = err.response?.data;
  if (!data || typeof data !== "object") return {};

  const record = data as Record<string, string[] | string | undefined>;
  const out: Record<string, string> = {};
  const skip = new Set(["error", "detail", "non_field_errors"]);

  for (const [key, val] of Object.entries(record)) {
    if (skip.has(key) || !val) continue;
    out[key] = Array.isArray(val) ? String(val[0]) : String(val);
  }
  return out;
}
