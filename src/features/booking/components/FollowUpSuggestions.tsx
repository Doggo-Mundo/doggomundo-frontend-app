import { CalendarPlus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeAppointment } from "@/lib/format-date";
import type { PetListItem } from "@/types/pet";
import type { AvailableSlot } from "@/types/appointment";

export interface FollowUpSuggestion {
  pet: PetListItem;
  slot: AvailableSlot;
}

interface Props {
  suggestions: FollowUpSuggestion[];
  serviceName: string;
  /** Pre-formatted price label (e.g. "$250") or null when not applicable. */
  servicePriceLabel: string | null;
  onPick: (suggestion: FollowUpSuggestion) => void;
}

/**
 * Post-booking nudge: when the customer just booked a slot and has other
 * pets registered, surface the next available slot(s) of the same service
 * paired one-by-one with each remaining pet. Clicking a card seeds the
 * wizard with that pet/slot pair so the user lands straight on the review
 * screen instead of re-doing BU → location → service → slot → pet.
 */
export function FollowUpSuggestions({
  suggestions,
  serviceName,
  servicePriceLabel,
  onPick,
}: Props) {
  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-2 text-left">
      <div>
        <h3 className="text-sm font-semibold">¿Aprovechas la visita?</h3>
        <p className="text-xs text-muted-foreground">
          {suggestions.length === 1
            ? "Te apartamos el siguiente turno para tu otra mascota."
            : "Te apartamos los siguientes turnos para tus otras mascotas."}
        </p>
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.pet.id}
            type="button"
            onClick={() => onPick(s)}
            className="block w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
          >
            <Card className="transition-shadow hover:shadow-md" size="sm">
              <CardContent className="flex items-center gap-3 px-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarPlus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {serviceName} para {s.pet.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatRelativeAppointment(s.slot.start)}
                    {servicePriceLabel && ` · ${servicePriceLabel}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
