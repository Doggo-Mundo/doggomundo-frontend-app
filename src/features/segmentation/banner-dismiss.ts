/**
 * Local persistence for the segmentation reminder banner's "close"
 * button. When the user dismisses (or completes the survey) we
 * park a timestamp in localStorage and skip re-showing the banner
 * for BANNER_COOLDOWN_MS. Everything is client-side by design —
 * backend doesn't care about dismissals, only about whether the
 * profile exists.
 *
 * Split into its own module so it's importable from the banner
 * (writer + reader) and the survey page (writer on complete/skip)
 * without cross-import gymnastics or shared component-file lint
 * warnings.
 */

const STORAGE_KEY = "doggo:segmentation_banner_dismissed_at";
const BANNER_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function dismissSegmentationBanner(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private mode / quota exceeded — no-op. Worst case the banner
    // reappears next mount which is arguably the right fallback
    // (we couldn't remember, so we ask again).
  }
}

export function isSegmentationBannerDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < BANNER_COOLDOWN_MS;
  } catch {
    return false;
  }
}
