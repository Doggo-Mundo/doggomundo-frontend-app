import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format-date";
import type { AvailableSlot } from "@/types/appointment";

interface Props {
  slots: AvailableSlot[];
  selectedStart: string | null;
  onSelect: (slot: AvailableSlot) => void;
}

export function SlotGrid({ slots, selectedStart, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
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
              "rounded-lg border px-2 py-2 text-sm font-medium transition-all active:scale-95 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background hover:bg-muted",
              disabled && "opacity-40 cursor-not-allowed hover:bg-background active:scale-100",
            )}
          >
            {formatTime(slot.start)}
          </button>
        );
      })}
    </div>
  );
}
