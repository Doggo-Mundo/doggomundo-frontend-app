import { http, HttpResponse } from "msw";
import type { User } from "@/types/user";

const BASE = "http://localhost/api";

export const mockCustomerUser: User = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "valentina@example.com",
  username: "valentina",
  first_name: "Valentina",
  last_name: "Pérez",
  full_name: "Valentina Pérez",
  phone: "+525512345678",
  photo: null,
  user_type: "CUSTOMER",
  email_verified: true,
  is_active: true,
  date_joined: "2026-01-01T00:00:00Z",
};

/**
 * Minimal set of handlers applied to every test. Individual tests can
 * override specific endpoints via `server.use(...)` in setup.
 *
 * Anything that a shared UI shell hits on mount belongs here so
 * every test doesn't have to re-declare it (HomePage's Day Care
 * quick-action probe, the booking wizard's add-ons discovery, etc.).
 * All default with empty results — tests that care about content
 * override explicitly.
 */
export const defaultHandlers = [
  http.get(`${BASE}/auth/me/`, () => HttpResponse.json(mockCustomerUser)),
  // HomePage probes the day care catalog to decide whether to render
  // the "Day Care" quick-action tile. Empty by default so the tile
  // hides — tests that want it visible override with data.
  http.get(`${BASE}/daycare/plans/`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
  ),
  // AddOnsPickerPage (F4-D) queries `/retail/products/?addons_only=true`
  // to decide whether the wizard step is worth showing. Default to
  // empty so the step auto-forwards to /book/review during integration
  // tests that don't care about cross-sell.
  http.get(`${BASE}/retail/products/`, () => HttpResponse.json([])),
  // BookingReviewPage's CoverageCard probe. Default = no coverage so
  // the card doesn't render — tests that want it override.
  http.get(`${BASE}/memberships/coverage/`, () =>
    HttpResponse.json({ covered: false, remaining: 0, total: 0 }),
  ),
];
