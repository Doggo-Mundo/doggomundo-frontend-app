/**
 * Recuperación ante chunks JS obsoletos tras un deploy.
 *
 * Cada build de Vite rota los hashes de los chunks. Una pestaña abierta
 * antes del deploy que navega a una ruta lazy pide un chunk que ya no
 * existe (404) y falla con "Failed to fetch dynamically imported module".
 * Recargar trae el index.html y el mapa de chunks vigentes.
 *
 * Anti-bucle: el timestamp de la última recarga vive en sessionStorage y
 * NO se borra al montar la app (montar `App` no prueba que los chunks
 * lazy carguen). Se permite otra recarga solo pasado RELOAD_COOLDOWN_MS,
 * así un deploy posterior en la misma pestaña sí se recupera, pero un
 * chunk realmente roto no entra en bucle de recargas.
 */

export const CHUNK_ERROR_RELOAD_FLAG = "chunk-error-reload-at";
export const RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamic(ally)? imported module|ChunkLoadError|Importing a module script failed/i;

let reloading = false;

export function isChunkLoadError(error: unknown): boolean {
  if (error === undefined || error === null) return false;
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERN.test(message);
}

/** True mientras una recarga ya disparada está por completarse. */
export function isReloading(): boolean {
  return reloading;
}

/**
 * Recarga la página salvo que ya se haya hecho hace menos de
 * RELOAD_COOLDOWN_MS. Devuelve si disparó la recarga.
 */
export function tryReloadOnce(now: number = Date.now()): boolean {
  if (reloading) return true;
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(CHUNK_ERROR_RELOAD_FLAG)) || 0;
  } catch {
    // sessionStorage bloqueado: sin guard persistente, mejor no recargar.
    return false;
  }
  if (last && now - last < RELOAD_COOLDOWN_MS) return false;
  try {
    sessionStorage.setItem(CHUNK_ERROR_RELOAD_FLAG, String(now));
  } catch {
    return false;
  }
  reloading = true;
  window.location.reload();
  return true;
}

/**
 * Vite emite `vite:preloadError` cuando falla el import dinámico o el
 * preload de CSS/JS. Cubre casos que el error boundary no ve.
 */
export function installPreloadErrorHandler(): void {
  window.addEventListener("vite:preloadError", (event) => {
    if (tryReloadOnce()) event.preventDefault();
  });
}

/** Solo para tests. */
export function _resetForTests(): void {
  reloading = false;
}
