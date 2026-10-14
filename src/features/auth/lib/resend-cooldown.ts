import axios from "axios";

/** Default client-side gap between resend clicks — independent of
 *  the backend's hourly IP throttle (OTPRateThrottle, 5/hour), which
 *  only kicks in on actual abuse. This is just UX: stop the user from
 *  mashing the button and burning through that hourly quota in seconds. */
export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

/**
 * DRF's default throttle response carries the wait time in the
 * `Retry-After` header (seconds), not the body. Reads it off a 429 so
 * the UI can show the real wait instead of guessing.
 */
export function getRetryAfterSeconds(err: unknown): number | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 429) return null;
  const header = err.response.headers?.["retry-after"];
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** "0:45" for sub-minute waits, "12:03" past that — mirrors how a
 *  phone OTP resend timer usually reads. */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
