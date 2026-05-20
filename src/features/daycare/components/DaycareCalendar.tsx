import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayAvailability } from "@/types/daycare";

interface Props {
  /** Date inside the month being shown. */
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  availability: DayAvailability[];
  selected: Set<string>;
  onToggle: (dateISO: string) => void;
  /** YYYY-MM-DD — anything before this is in the past and not selectable. */
  todayISO: string;
  /** YYYY-MM-DD — first day the enrollment covers. */
  enrollmentStartISO: string;
  /** YYYY-MM-DD — last day the enrollment covers. */
  enrollmentEndISO: string;
  /** When true, the user has hit their credit budget — disable new selections. */
  atCreditLimit: boolean;
  isLoading?: boolean;
}

type DayState =
  | { kind: "past" }
  | { kind: "out_of_plan" }
  | { kind: "closed" }
  | { kind: "full"; available: 0 }
  | { kind: "available"; available: number };

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function DaycareCalendar({
  monthDate,
  onMonthChange,
  availability,
  selected,
  onToggle,
  todayISO,
  enrollmentStartISO,
  enrollmentEndISO,
  atCreditLimit,
  isLoading = false,
}: Props) {
  const grid = useMemo(() => buildCalendarGrid(monthDate), [monthDate]);
  const byDate = useMemo(() => {
    const map = new Map<string, DayAvailability>();
    for (const a of availability) map.set(a.date, a);
    return map;
  }, [availability]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(monthDate, -1))}
          aria-label="Mes anterior"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium capitalize">
          {format(monthDate, "LLLL yyyy", { locale: es })}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(monthDate, 1))}
          aria-label="Mes siguiente"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1.5",
          isLoading && "opacity-60",
        )}
      >
        {grid.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthDate);
          if (!inMonth) {
            return (
              <div
                key={iso}
                aria-hidden="true"
                className="aspect-square rounded-md text-center text-xs text-muted-foreground/30"
              >
                <span className="block pt-2">{format(day, "d")}</span>
              </div>
            );
          }

          const isSelected = selected.has(iso);
          const state = computeDayState({
            iso,
            todayISO,
            enrollmentStartISO,
            enrollmentEndISO,
            availability: byDate.get(iso),
          });
          const disabledByCredits =
            atCreditLimit && state.kind === "available" && !isSelected;
          const interactive = state.kind === "available" && !disabledByCredits;

          return (
            <DayCell
              key={iso}
              day={day}
              iso={iso}
              state={state}
              selected={isSelected}
              interactive={interactive}
              onClick={() => interactive && onToggle(iso)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DayCellProps {
  day: Date;
  iso: string;
  state: DayState;
  selected: boolean;
  interactive: boolean;
  onClick: () => void;
}

function DayCell({ day, state, selected, interactive, onClick }: DayCellProps) {
  const label = labelForState(state);
  const dayNumber = format(day, "d");

  const baseClass =
    "aspect-square rounded-md border text-xs flex flex-col items-center justify-center gap-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors";

  let toneClass = "";
  if (selected) {
    toneClass = "border-primary bg-primary text-primary-foreground font-semibold";
  } else if (state.kind === "available") {
    toneClass = "border-border bg-background hover:bg-muted cursor-pointer";
  } else if (state.kind === "full") {
    toneClass =
      "border-destructive/30 bg-destructive/5 text-destructive/70 cursor-not-allowed";
  } else if (state.kind === "closed") {
    toneClass =
      "border-border/50 bg-muted/40 text-muted-foreground/60 cursor-not-allowed";
  } else {
    // past or out_of_plan
    toneClass =
      "border-border/40 bg-background text-muted-foreground/40 cursor-not-allowed";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={selected}
      aria-label={`${dayNumber} ${format(day, "MMMM yyyy", { locale: es })} — ${label.aria}`}
      title={label.title}
      className={cn(baseClass, toneClass)}
    >
      <span className="leading-none">{dayNumber}</span>
      {label.subtitle && (
        <span
          className={cn(
            "text-[9px] leading-none",
            selected ? "text-primary-foreground/80" : "text-current",
          )}
        >
          {label.subtitle}
        </span>
      )}
    </button>
  );
}

// ---------- Helpers ----------

function buildCalendarGrid(monthDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

interface DayStateArgs {
  iso: string;
  todayISO: string;
  enrollmentStartISO: string;
  enrollmentEndISO: string;
  availability: DayAvailability | undefined;
}

function computeDayState({
  iso,
  todayISO,
  enrollmentStartISO,
  enrollmentEndISO,
  availability,
}: DayStateArgs): DayState {
  if (iso < todayISO) return { kind: "past" };
  if (iso < enrollmentStartISO || iso > enrollmentEndISO) {
    return { kind: "out_of_plan" };
  }
  if (!availability || !availability.is_open) return { kind: "closed" };
  if (availability.available <= 0) return { kind: "full", available: 0 };
  return { kind: "available", available: availability.available };
}

function labelForState(state: DayState): {
  aria: string;
  title: string;
  subtitle: string | null;
} {
  switch (state.kind) {
    case "available":
      return {
        aria: `${state.available} cupos disponibles`,
        title: `${state.available} cupos disponibles`,
        subtitle: null,
      };
    case "full":
      return { aria: "Sin cupo", title: "Sin cupo", subtitle: "Lleno" };
    case "closed":
      return { aria: "Cerrado", title: "Cerrado", subtitle: "—" };
    case "out_of_plan":
      return {
        aria: "Fuera de la vigencia del plan",
        title: "Tu plan no cubre esta fecha",
        subtitle: null,
      };
    case "past":
      return { aria: "Día pasado", title: "Día pasado", subtitle: null };
  }
}
