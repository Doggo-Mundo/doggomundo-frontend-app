import { format, formatDistanceStrict, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const TIMEZONE = "America/Mexico_City";

export function formatDate(dateString: string): string {
  const zonedDate = toZonedTime(new Date(dateString), TIMEZONE);
  return format(zonedDate, "dd/MM/yyyy");
}

export function formatDateTime(dateString: string): string {
  const zonedDate = toZonedTime(new Date(dateString), TIMEZONE);
  return format(zonedDate, "dd/MM/yyyy HH:mm");
}

export function formatLongDate(dateString: string): string {
  const zonedDate = toZonedTime(new Date(dateString), TIMEZONE);
  return format(zonedDate, "EEEE d 'de' MMMM", { locale: es });
}

export function formatTime(dateString: string): string {
  const zonedDate = toZonedTime(new Date(dateString), TIMEZONE);
  return format(zonedDate, "HH:mm");
}

/** Hour of day (0–23) in Mexico_City local time. Used to group slots. */
export function getLocalHour(dateString: string): number {
  return toZonedTime(new Date(dateString), TIMEZONE).getHours();
}

export function formatDayLabel(dateString: string): string {
  const zonedDate = toZonedTime(new Date(dateString), TIMEZONE);
  return format(zonedDate, "EEE d 'de' MMM", { locale: es });
}

/**
 * Returns YYYY-MM-DD representing the local calendar date in Mexico_City
 * for a given JS Date (which is already anchored to a UTC instant).
 */
export function toLocalDateISO(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd");
}

/**
 * Given a YYYY-MM-DD string interpreted as Mexico_City local date, return
 * the UTC ISO timestamps that bracket that day. Used to filter slot queries
 * by `start_after` / `start_before`.
 */
export function localDayBoundsUTC(
  dateISO: string,
): { startUTC: string; endUTC: string } {
  return {
    startUTC: fromZonedTime(`${dateISO}T00:00:00`, TIMEZONE).toISOString(),
    endUTC: fromZonedTime(`${dateISO}T23:59:59.999`, TIMEZONE).toISOString(),
  };
}

/**
 * Hours of advance notice the customer must give to cancel or reschedule
 * their own appointment without admin intervention. Mirrors
 * `CUSTOMER_CANCELLATION_WINDOW_HOURS` on the backend — keep in sync.
 */
export const CANCELLATION_WINDOW_HOURS = 12;

/**
 * Returns true when `dateString` is less than the cancellation-window
 * threshold away from now. Matches the backend rule: customers cannot
 * cancel / reschedule inside the window.
 */
export function isWithinCancellationWindow(dateString: string): boolean {
  const target = new Date(dateString).getTime();
  const diffMs = target - Date.now();
  return diffMs < CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
}

export function formatAgeFromBirth(birthDate: string | null): string | null {
  if (!birthDate) return null;
  try {
    const date = parseISO(birthDate);
    return formatDistanceStrict(date, new Date(), { locale: es });
  } catch {
    return null;
  }
}

/**
 * Human-friendly relative description of an upcoming appointment, anchored
 * in Mexico_City local time. Examples:
 *   - "En 2 h" (within 24h, future)
 *   - "Ahora" / "En curso" (between now and 15 min from now)
 *   - "Mañana 10:00"
 *   - "El viernes 10:00" (within the next 6 days)
 *   - "15 may · 10:00" (further out)
 *   - "Pasó" (in the past)
 */
export function formatRelativeAppointment(dateString: string): string {
  const target = new Date(dateString);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs < 0) return "Pasó";

  const diffMin = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);

  if (diffMin < 60) {
    if (diffMin < 5) return "Ahora";
    return `En ${diffMin} min`;
  }
  if (diffHours < 24) {
    return `En ${diffHours} h · ${formatTime(dateString)}`;
  }

  const targetZoned = toZonedTime(target, TIMEZONE);
  const nowZoned = toZonedTime(now, TIMEZONE);
  const targetDay = format(targetZoned, "yyyy-MM-dd");
  const todayDay = format(nowZoned, "yyyy-MM-dd");
  const tomorrow = new Date(nowZoned);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = format(tomorrow, "yyyy-MM-dd");

  if (targetDay === todayDay) {
    return `Hoy ${formatTime(dateString)}`;
  }
  if (targetDay === tomorrowDay) {
    return `Mañana ${formatTime(dateString)}`;
  }

  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays < 7) {
    return `${format(targetZoned, "EEEE", { locale: es })} ${formatTime(dateString)}`;
  }
  return `${format(targetZoned, "d 'de' MMM", { locale: es })} · ${formatTime(dateString)}`;
}
