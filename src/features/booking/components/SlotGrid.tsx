import type { ReactNode } from "react";
import { Sun, CloudSun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, getLocalHour } from "@/lib/format-date";
import type { AvailableSlot } from "@/types/appointment";

interface Props {
  slots: AvailableSlot[];
  selectedStart: string | null;
  onSelect: (slot: AvailableSlot) => void;
}

interface Period {
  key: string;
  label: string;
  icon: ReactNode;
  match: (hour: number) => boolean;
}

const PERIODS: Period[] = [
  {
    key: "morning",
    label: "Mañana",
    icon: <Sun className="h-4 w-4" />,
    match: (h) => h < 12,
  },
  {
    key: "afternoon",
    label: "Tarde",
    icon: <CloudSun className="h-4 w-4" />,
    match: (h) => h >= 12 && h < 18,
  },
  {
    key: "evening",
    label: "Noche",
    icon: <Moon className="h-4 w-4" />,
    match: (h) => h >= 18,
  },
];

function durationMin(slot: AvailableSlot): number {
  const ms = new Date(slot.end).getTime() - new Date(slot.start).getTime();
  return Math.round(ms / 60_000);
}

export function SlotGrid({ slots, selectedStart, onSelect }: Props) {
  const groups = PERIODS.map((period) => ({
    period,
    items: slots.filter((s) => period.match(getLocalHour(s.start))),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map(({ period, items }) => (
        <section key={period.key} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="text-primary">{period.icon}</span>
            {period.label}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((slot) => {
              const disabled = !slot.is_available;
              const active = slot.start === selectedStart;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => !disabled && onSelect(slot)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all outline-none",
                    "focus-visible:ring-3 focus-visible:ring-ring/50",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                      : "border-border bg-background shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-95",
                    disabled &&
                      "opacity-40 cursor-not-allowed hover:translate-y-0 hover:border-border hover:shadow-sm active:scale-100",
                  )}
                >
                  {active && (
                    <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5" />
                  )}
                  <span className="text-base font-semibold tabular-nums">
                    {formatTime(slot.start)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px]",
                      active
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {durationMin(slot)} min
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
