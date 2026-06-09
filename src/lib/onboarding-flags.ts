/**
 * Lightweight client-side flags for first-run UX.
 *
 * The "first pet pending" flag is set when a user verifies their email and
 * read by the login page so the very first login lands on `/pets/new`
 * instead of the home dashboard. Once consumed it's cleared so subsequent
 * visits to home aren't hijacked.
 */

const FIRST_PET_KEY = "doggo:onboarding-first-pet";

export function markFirstPetPending(): void {
  try {
    localStorage.setItem(FIRST_PET_KEY, "1");
  } catch {
    /* localStorage unavailable (private mode, etc.) — skip silently */
  }
}

export function consumeFirstPetPending(): boolean {
  try {
    const v = localStorage.getItem(FIRST_PET_KEY);
    if (v) localStorage.removeItem(FIRST_PET_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
