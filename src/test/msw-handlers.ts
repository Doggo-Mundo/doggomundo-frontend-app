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
 */
export const defaultHandlers = [
  http.get(`${BASE}/auth/me/`, () => HttpResponse.json(mockCustomerUser)),
];
