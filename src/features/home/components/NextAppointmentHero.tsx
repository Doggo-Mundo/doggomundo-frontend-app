import { Link } from "react-router-dom";
import { ChevronRight, MapPin, PawPrint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeAppointment } from "@/lib/format-date";
import type { AppointmentListItem } from "@/types/appointment";

interface Props {
  appointment: AppointmentListItem;
  petName?: string | null;
}

export function NextAppointmentHero({ appointment, petName }: Props) {
  return (
    <Link
      to={`/my/appointments/${appointment.id}`}
      className="group block"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm transition-all group-hover:shadow-md">
        {/* Decorative background flourish */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-primary-foreground/5"
        />
        <CardContent className="relative space-y-3 py-5">
          <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            Tu próxima cita
          </p>
          <p className="text-3xl font-semibold capitalize leading-tight">
            {formatRelativeAppointment(appointment.scheduled_start)}
          </p>
          <div className="space-y-1 text-sm opacity-90">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {appointment.business_unit_name}
            </p>
            {petName && (
              <p className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 shrink-0" />
                {petName}
              </p>
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
