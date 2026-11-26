import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHUNK_ERROR_RELOAD_FLAG,
  RELOAD_COOLDOWN_MS,
  installPreloadErrorHandler,
  isChunkLoadError,
  tryReloadOnce,
  _resetForTests,
} from "./chunk-reload";

const reload = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  reload.mockReset();
  _resetForTests();
  vi.stubGlobal("location", { ...window.location, reload });
});

describe("isChunkLoadError", () => {
  it.each([
    "Failed to fetch dynamically imported module: https://x/assets/A-1.js",
    "error loading dynamically imported module",
    "ChunkLoadError: Loading chunk 3 failed",
    "Importing a module script failed.",
  ])("reconoce %s", (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it("ignora otros errores y acepta no-Error", () => {
    expect(isChunkLoadError(new Error("boom"))).toBe(false);
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(true);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe("tryReloadOnce", () => {
  it("recarga la primera vez y guarda timestamp", () => {
    expect(tryReloadOnce(1_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_ERROR_RELOAD_FLAG)).toBe("1000");
  });

  it("no recarga de nuevo dentro del cooldown (anti-bucle)", () => {
    tryReloadOnce(1_000);
    _resetForTests();
    expect(tryReloadOnce(1_000 + RELOAD_COOLDOWN_MS - 1)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("permite otra recarga pasado el cooldown (otro deploy en la misma pestaña)", () => {
    tryReloadOnce(1_000);
    _resetForTests();
    expect(tryReloadOnce(1_000 + RELOAD_COOLDOWN_MS)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("tolera un flag corrupto en sessionStorage", () => {
    sessionStorage.setItem(CHUNK_ERROR_RELOAD_FLAG, "basura");
    expect(tryReloadOnce(5_000)).toBe(true);
  });
});

describe("installPreloadErrorHandler", () => {
  it("recarga ante vite:preloadError sin tragarse el error", () => {
    // Si se cancelara, Vite resolvería el import() con undefined y la
    // ruta lazy reventaría con un TypeError que no parece de chunk.
    installPreloadErrorHandler();
    const event = new Event("vite:preloadError", { cancelable: true });
    window.dispatchEvent(event);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it("si ya recargó dentro del cooldown, no vuelve a recargar", () => {
    installPreloadErrorHandler();
    window.dispatchEvent(new Event("vite:preloadError", { cancelable: true }));
    _resetForTests();
    const second = new Event("vite:preloadError", { cancelable: true });
    window.dispatchEvent(second);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(second.defaultPrevented).toBe(false);
  });
});
