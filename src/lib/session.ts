/**
 * Centralized "wipe everything user-scoped" helper.
 *
 * Motivation: an incident where logging out as user A and
 * logging in as user B left the SPA showing A's data until a
 * hard refresh. Root cause was that our logout only cleared
 * the auth store and the refresh token — React Query's cache,
 * persisted Zustand stores (cart, booking flow), and various
 * `doggo:*` localStorage keys all survived.
 *
 * Now every path that ends a session (manual button, 401
 * auto-logout in the axios interceptor, expired refresh)
 * MUST call resetUserSession() so no user-scoped byte
 * outlives the transition.
 *
 * If you add new user-scoped persisted state, add it here.
 */
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { queryClient } from "@/lib/query-client";

/** localStorage/sessionStorage keys that are tied to a specific
 *  user identity and MUST be wiped on session end. */
const USER_SCOPED_STORAGE_KEYS = [
  "refresh_token",
  "doggo:cart",
  "doggo:booking-flow",
  "doggo:onboarding-first-pet",
  "doggo:onboarding-segmentation",
  "doggo:segmentation_banner_dismissed_at",
] as const;

export function resetUserSession(): void {
  // 1. Zustand stores that own their own state — call their
  //    reset actions so anything derived stays consistent.
  useAuthStore.getState().logout();
  useCartStore.getState().clear();

  // 2. React Query cache. Without this, cached responses
  //    from user A remain in memory and get rendered before
  //    user B's queries refetch.
  queryClient.clear();

  // 3. Wipe every persistence key both from localStorage and
  //    sessionStorage. Belt-and-suspenders — the Zustand
  //    stores above should have cleared their own persist
  //    slots but silent quota failures / private-mode edge
  //    cases mean we can't fully trust that.
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* private mode / quota — skip */
    }
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* skip */
    }
  }
}
