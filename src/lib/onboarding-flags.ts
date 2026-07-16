/**
 * Lightweight client-side flags for first-run UX.
 *
 * Two flags today, both set at email-verification time so the user's
 * very first login lands in a guided onboarding sequence instead of
 * an empty dashboard:
 *
 *   1. Segmentation pending → /onboarding/preferences
 *   2. First pet pending    → /pets/new
 *
 * Login consumes them in that order (segmentation first) so the
 * short survey happens before the pet form. After the survey
 * (submit OR skip) we consume the pet flag if present and continue
 * the chain; otherwise land on /. Once consumed each flag is
 * cleared so subsequent visits to home aren't hijacked.
 */

const FIRST_PET_KEY = "doggo:onboarding-first-pet";
const SEGMENTATION_KEY = "doggo:onboarding-segmentation";

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

export function markSegmentationPending(): void {
  try {
    localStorage.setItem(SEGMENTATION_KEY, "1");
  } catch {
    /* skip silently */
  }
}

export function consumeSegmentationPending(): boolean {
  try {
    const v = localStorage.getItem(SEGMENTATION_KEY);
    if (v) localStorage.removeItem(SEGMENTATION_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
