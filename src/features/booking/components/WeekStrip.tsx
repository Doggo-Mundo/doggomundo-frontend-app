import { useMemo, useState } from "react";
import { addDays, format, isSameMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TIMEZONE, toLocalDateISO } from "@/lib/format-date";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (dateISO: string) => void;
  /**
   * Maximum weeks forward the user can navigate. Default: 1 — customers can
   * only book in the current week + the next one. When today rolls over into
   * what was "next week", a fresh "next week" becomes available automatically.
   */
  maxWeeksAhead?: number;
}

interface Day {
  iso: string;
  weekday: string;
  dayNumber: string;
  isToday: boolean;
  isPast: boolean;
}

function buildWeek(referenceDate: Date, todayISO: string): Day[] {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(monday, i);
    const iso = format(d, "yyyy-MM-dd");
    return {
      iso,
      weekday: format(d, "EEEEEE", { locale: es }).toUpperCase(),
      dayNumber: format(d, "d"),
      isToday: iso === todayISO,
      isPast: iso < todayISO,
    };
  });
}

function formatRange(days: Day[]): string {
  const start = new Date(`${days[0].iso}T12:00:00`);
  const end = new Date(`${days[6].iso}T12:00:00`);
  if (isSameMonth(start, end)) {
    return `${format(start, "d")} – ${format(end, "d 'de' MMMM", { locale: es })}`;
  }
  return `${format(start, "d 'de' MMM", { locale: es })} – ${format(
    end,
    "d 'de' MMM",
    { locale: es },
  )}`;
}

export function WeekStrip({ value, onChange, maxWeeksAhead = 1 }: Props) {
  const todayMX = useMemo(
    () => toZonedTime(new Date(), TIMEZONE),
    [],
  );
  const todayISO = useMemo(() => toLocalDateISO(new Date()), []);

  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    const monday = addDays(
      startOfWeek(todayMX, { weekStartsOn: 1 }),
      weekOffset * 7,
    );
    return buildWeek(monday, todayISO);
  }, [todayMX, todayISO, weekOffset]);

  const canGoBack = weekOffset > 0;
  const canGoForward = weekOffset < maxWeeksAhead;

  function navigateWeeks(delta: number) {
    const newOffset = weekOffset + delta;
    setWeekOffset(newOffset);
    // Auto-select the first bookable day of the destination week so the slot
    // grid refreshes even if the user hasn't tapped a specific day yet.
    if (newOffset === 0) {
      onChange(todayISO);
    } else {
      const monday = addDays(
        startOfWeek(todayMX, { weekStartsOn: 1 }),
        newOffset * 7,
      );
      onChange(format(monday, "yyyy-MM-dd"));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => canGoBack && navigateWeeks(-1)}
          disabled={!canGoBack}
          aria-label="Semana anterior"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            canGoBack
              ? "border-border bg-background hover:bg-muted"
              : "border-border/50 bg-background/60 text-muted-foreground/40 cursor-not-allowed",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-sm font-medium capitalize">
          {weekOffset === 0 ? "Esta semana" : formatRange(days)}
        </p>

        <button
          type="button"
          onClick={() => canGoForward && navigateWeeks(1)}
          disabled={!canGoForward}
          aria-label="Semana siguiente"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            canGoForward
              ? "border-border bg-background hover:bg-muted"
              : "border-border/50 bg-background/60 text-muted-foreground/40 cursor-not-allowed",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const active = d.iso === value;
          const disabled = d.isPast;
          return (
            <button
              key={d.iso}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(d.iso)}
              aria-pressed={active}
              aria-label={`${d.weekday} ${d.dayNumber}`}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : d.isToday
                    ? "border-primary/50 bg-secondary text-secondary-foreground"
                    : "border-border bg-background",
                !disabled && !active && "hover:bg-muted",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  active ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {d.weekday}
              </span>
              <span className="text-base font-semibold leading-tight">
                {d.dayNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
