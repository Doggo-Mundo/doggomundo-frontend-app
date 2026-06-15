import { Link } from "react-router-dom";
import { ChevronRight, MapPin, PawPrint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { formatRelativeAppointment } from "@/lib/format-date";
import type { AppointmentListItem } from "@/types/appointment";
import type { PetListItem } from "@/types/pet";

interface Props {
  appointment: AppointmentListItem;
  pet?: PetListItem | null;
}

export function NextAppointmentHero({ appointment, pet }: Props) {
  return (
    <Link
      to={`/my/appointments/${appointment.id}`}
      className="group block"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground shadow-sm transition-all group-hover:shadow-lg">
        {/* Soft glow circles — same as before, kept for depth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-primary-foreground/5"
        />
        {/* Decorative paw-print pattern — subtle brand warmth that prevents
            the card from reading as a plain marketing gradient. */}
        <PawPrint
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 bottom-2 h-24 w-24 -rotate-12 text-primary-foreground/10"
        />
        <PawPrint
          aria-hidden="true"
          className="pointer-events-none absolute right-20 top-6 h-10 w-10 rotate-12 text-primary-foreground/10"
        />
        <CardContent className="relative space-y-3 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                Tu próxima cita
              </p>
              <p className="text-3xl font-semibold capitalize leading-tight">
                {formatRelativeAppointment(appointment.scheduled_start)}
              </p>
              <div className="space-y-1 text-sm opacity-90">
                {appointment.primary_service_name && (
                  <p className="font-semibold">
                    {appointment.primary_service_name}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {appointment.business_unit_name}
                </p>
                {pet && (
                  <p className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 shrink-0" />
                    {pet.name}
                  </p>
                )}
              </div>
            </div>
            {pet && (
              <div className="relative shrink-0">
                <PetAvatar
                  name={pet.name}
                  photo={pet.photo}
                  size="lg"
                  className="ring-4 ring-primary-foreground/20"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 pt-1 text-xs font-medium opacity-90 transition-opacity group-hover:opacity-100">
            Ver detalle
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
