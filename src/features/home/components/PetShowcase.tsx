import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { formatRelativeAppointment } from "@/lib/format-date";
import { partitionAppointments } from "@/features/appointments/lib/filter";
import { cn } from "@/lib/utils";
import type { PetListItem } from "@/types/pet";
import type { AppointmentListItem } from "@/types/appointment";

interface Props {
  pets: PetListItem[];
  appointments: AppointmentListItem[];
}

/**
 * Horizontal strip of the customer's pets on the home page. Each card shows
 * a big photo + name + age + the pet's next appointment status (or "sin
 * cita" if nothing scheduled). The intent is emotional anchoring — the
 * customer should see their dog the moment the app opens, not just text.
 */
export function PetShowcase({ pets, appointments }: Props) {
  const activePets = pets.filter((p) => p.is_active);
  if (activePets.length === 0) return null;

  // Index of pet.id → soonest upcoming appointment. partitionAppointments
  // already sorts upcoming ascending so the first match per pet IS the
  // soonest.
  const upcomingByPet = new Map<string, AppointmentListItem>();
  partitionAppointments(appointments).upcoming.forEach((a) => {
    if (a.pet && !upcomingByPet.has(a.pet)) {
      upcomingByPet.set(a.pet, a);
    }
  });

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Tus peludos
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-thin">
        <ul className="flex gap-3">
          {activePets.map((pet) => (
            <li key={pet.id} className="shrink-0">
              <PetShowcaseCard
                pet={pet}
                upcoming={upcomingByPet.get(pet.id) ?? null}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface CardProps {
  pet: PetListItem;
  upcoming: AppointmentListItem | null;
}

function PetShowcaseCard({ pet, upcoming }: CardProps) {
  const ageLabel = pet.age_years > 0
    ? `${pet.age_years} año${pet.age_years === 1 ? "" : "s"}`
    : null;
  const statusLabel = upcoming
    ? formatRelativeAppointment(upcoming.scheduled_start)
    : "Sin cita próxima";

  return (
    <Link
      to={`/pets/${pet.id}`}
      className={cn(
        "group relative flex w-40 flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center outline-none transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        upcoming && "border-primary/30 bg-gradient-to-b from-primary/5 to-transparent",
      )}
    >
      <PetAvatar
        name={pet.name}
        photo={pet.photo}
        size="lg"
        className="ring-2 ring-background"
      />
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-semibold">{pet.name}</p>
        {ageLabel && (
          <p className="text-[11px] text-muted-foreground">{ageLabel}</p>
        )}
      </div>
      <p
        className={cn(
          "flex w-full items-center justify-center gap-0.5 truncate rounded-full px-2 py-0.5 text-[11px]",
          upcoming
            ? "bg-primary/10 font-medium text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {statusLabel}
        {upcoming && (
          <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
        )}
      </p>
    </Link>
  );
}
