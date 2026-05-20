import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { api } from "./client";
import { useAuthStore } from "@/stores/auth-store";
import { server } from "@/test/msw-server";

const API = "http://localhost/api";

describe("api client — response interceptor", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "stale-access",
      user: null,
      isAuthenticated: false,
    });
    localStorage.setItem("refresh_token", "valid-refresh");
  });

  afterEach(() => {
    localStorage.removeItem("refresh_token");
    useAuthStore.getState().logout();
  });

  it("refreshes the access token on 401 and retries the original request", async () => {
    const calls: string[] = [];
    let firstCall = true;

    server.use(
      http.get(`${API}/pets/`, ({ request }) => {
        calls.push(request.headers.get("Authorization") ?? "");
        if (firstCall) {
          firstCall = false;
          return HttpResponse.json({ detail: "Token expired" }, { status: 401 });
        }
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${API}/auth/token/refresh/`, async ({ request }) => {
        const body = (await request.json()) as { refresh: string };
        expect(body.refresh).toBe("valid-refresh");
        return HttpResponse.json({
          access: "fresh-access",
          refresh: "fresh-refresh",
        });
      }),
    );

    const { data } = await api.get("/pets/");

    expect(data).toEqual({ ok: true });
    // First call had the stale token, second call had the new one
    expect(calls[0]).toBe("Bearer stale-access");
    expect(calls[1]).toBe("Bearer fresh-access");
    // Store got updated
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    // Rotated refresh token persisted
    expect(localStorage.getItem("refresh_token")).toBe("fresh-refresh");
  });

  it("passes through non-401 errors without touching the refresh endpoint", async () => {
    let refreshCalled = false;
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
      http.post(`${API}/auth/token/refresh/`, () => {
        refreshCalled = true;
        return HttpResponse.json({ access: "x" });
      }),
    );

    await expect(api.get("/pets/")).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(refreshCalled).toBe(false);
  });

  it("skips refresh when there is no refresh_token in storage", async () => {
    localStorage.removeItem("refresh_token");
    let refreshCalled = false;

    // Avoid the interceptor's `window.location.href = "/login"` side-effect
    // from mutating happy-dom's location during the test.
    const originalHref = window.location.href;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, href: originalHref },
    });

    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({ detail: "no auth" }, { status: 401 }),
      ),
      http.post(`${API}/auth/token/refresh/`, () => {
        refreshCalled = true;
        return HttpResponse.json({ access: "x" });
      }),
    );

    await expect(api.get("/pets/")).rejects.toBeDefined();
    expect(refreshCalled).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
