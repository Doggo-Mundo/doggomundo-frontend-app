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
  /** Themed colors for the period header chip. */
  chip: string;
  match: (hour: number) => boolean;
}

const PERIODS: Period[] = [
  {
    key: "morning",
    label: "Mañana",
    icon: <Sun className="h-4 w-4" />,
    chip: "bg-amber-100 text-amber-600",
    match: (h) => h < 12,
  },
  {
    key: "afternoon",
    label: "Tarde",
    icon: <CloudSun className="h-4 w-4" />,
    chip: "bg-sky-100 text-sky-600",
    match: (h) => h >= 12 && h < 18,
  },
  {
    key: "evening",
    label: "Noche",
    icon: <Moon className="h-4 w-4" />,
    chip: "bg-indigo-100 text-indigo-600",
    match: (h) => h >= 18,
  },
];

function durationMin(slot: AvailableSlot): number {
  const ms = new Date(slot.end).getTime() - new Date(slot.start).getTime();
  return Math.round(ms / 60_000);
}

/** F-Slots B: agrupa slots que comparten inicio+fin (misma capacidad
 *  agregada). Antes con 2 recursos el cliente veía 2 chips
 *  idénticos "09:30" — confuso y sugería 2 opciones distintas. Ahora
 *  ve UN chip con "N disponibles". Al reservar tomamos el primer
 *  slot libre del grupo — backend valida capacidad al confirmar. */
interface SlotGroup {
  /** El slot que se reserva al hacer click. Es el primer bookable
   *  del grupo (o el primero si ninguno es bookable, aunque en ese
   *  caso el chip queda disabled). */
  primary: AvailableSlot;
  /** Cantidad total de slots en el mismo (start, end) que están
   *  disponibles — se muestra como "N disponibles". */
  availableCount: number;
}

function groupIdenticalSlots(slots: AvailableSlot[]): SlotGroup[] {
  const map = new Map<string, SlotGroup>();
  for (const s of slots) {
    const key = `${s.start}|${s.end}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        primary: s,
        availableCount: s.is_available ? 1 : 0,
      });
    } else {
      // Preferimos como primary el primer bookable — si el primero
      // no lo era, lo reemplazamos por este.
      if (!prev.primary.is_available && s.is_available) {
        prev.primary = s;
      }
      if (s.is_available) prev.availableCount += 1;
    }
  }
  return Array.from(map.values());
}

export function SlotGrid({ slots, selectedStart, onSelect }: Props) {
  const grouped = groupIdenticalSlots(slots);
  const groups = PERIODS.map((period) => ({
    period,
    items: grouped.filter(
      (g) => period.match(getLocalHour(g.primary.start)),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map(({ period, items }) => (
        <section key={period.key} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                period.chip,
              )}
            >
              {period.icon}
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              {period.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {items.length} horarios
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {items.map((group) => {
              const slot = group.primary;
              const disabled = group.availableCount === 0;
              const active = slot.start === selectedStart;
              const showMulti = group.availableCount > 1;
              return (
                <button
                  key={`${slot.start}-${slot.end}`}
                  type="button"
                  onClick={() => !disabled && onSelect(slot)}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl border px-2 py-3.5 outline-none transition-all duration-200",
                    "focus-visible:ring-3 focus-visible:ring-accent/50",
                    active
                      ? "border-transparent bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-accent/30 scale-[1.04]"
                      : "border-accent/15 bg-surface-soft text-foreground hover:-translate-y-1 hover:border-accent hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/20 active:scale-95",
                    disabled &&
                      "pointer-events-none opacity-40 hover:translate-y-0 hover:border-accent/15 hover:bg-surface-soft hover:shadow-none",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 transition-opacity",
                      active
                        ? "bg-white/40 opacity-100"
                        : "bg-accent opacity-0 group-hover:opacity-100",
                    )}
                  />
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-lg font-bold leading-none tabular-nums">
                    {formatTime(slot.start)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {durationMin(slot)} min
                    {showMulti && ` · ${group.availableCount} disponibles`}
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
