import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw-server";

// Give the Axios client a resolvable base URL in tests. The real dev proxy
// rewrites `/api` → `:8000`, but jsdom has no proxy, so we point to a dummy
// host that MSW can intercept.
vi.stubEnv("VITE_API_BASE_URL", "http://localhost/api");

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
