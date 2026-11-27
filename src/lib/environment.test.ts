import { describe, expect, it } from "vitest";
import { applyEnvironmentTitle, isTestEnvironment } from "./environment";

describe("isTestEnvironment", () => {
  it("staging por variable de entorno", () => {
    expect(isTestEnvironment("staging", "app.doggomundo.com.mx")).toBe(true);
    expect(isTestEnvironment("Staging", "")).toBe(true);
  });

  it("staging por dominio aunque falte la variable", () => {
    expect(isTestEnvironment(undefined, "staging.app.doggomundo.com.mx")).toBe(true);
    expect(isTestEnvironment(undefined, "admin-staging.up.railway.app")).toBe(true);
  });

  it("producción y local no son ambiente de pruebas", () => {
    expect(isTestEnvironment("production", "app.doggomundo.com.mx")).toBe(false);
    expect(isTestEnvironment(undefined, "app.doggomundo.com.mx")).toBe(false);
    expect(isTestEnvironment(undefined, "localhost")).toBe(false);
  });
});

describe("applyEnvironmentTitle", () => {
  it("antepone [PRUEBAS] una sola vez", () => {
    document.title = "Doggo Mundo";
    applyEnvironmentTitle(document, true);
    applyEnvironmentTitle(document, true);
    expect(document.title).toBe("[PRUEBAS] Doggo Mundo");
  });

  it("no toca el título en producción", () => {
    document.title = "Doggo Mundo";
    applyEnvironmentTitle(document, false);
    expect(document.title).toBe("Doggo Mundo");
  });
});

describe("isStripeTestMode", () => {
  it("solo con llave pk_test_", async () => {
    const { isStripeTestMode } = await import("./environment");
    expect(isStripeTestMode("pk_test_abc")).toBe(true);
    expect(isStripeTestMode("pk_live_abc")).toBe(false);
    expect(isStripeTestMode(undefined)).toBe(false);
  });
});
