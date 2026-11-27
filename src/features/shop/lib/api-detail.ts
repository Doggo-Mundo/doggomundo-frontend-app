/**
 * Mensaje para el cliente a partir de un error de Axios. La tienda
 * (checkout, disponibilidad del carrito) responde los 400 con
 * `{ detail: "<frase lista para mostrar>" }` — p. ej. "Solo queda 1 de
 * “Kong” en Carso Palmas." —, así que se muestra tal cual. Cualquier
 * otra forma (sin respuesta, 500 HTML, detail no-string) cae al
 * `fallback`.
 */
export function extractApiDetail(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } } | null)?.response
    ?.data;
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}
