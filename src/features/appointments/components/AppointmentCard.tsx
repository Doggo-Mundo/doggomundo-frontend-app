import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Clock, PawPrint } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { formatLongDate, formatTime } from "@/lib/format-date";
import type { AppointmentListItem } from "@/types/appointment";

interface Props {
  appointment: AppointmentListItem;
  petName?: string | null;
}

export function AppointmentCard({ appointment, petName }: Props) {
  return (
    <Link
      to={`/my/appointments/${appointment.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-medium">
                {appointment.business_unit_name}
              </p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
              <Calendar className="h-3 w-3" />
              {formatLongDate(appointment.scheduled_start)}
              <Clock className="ml-1 h-3 w-3" />
              {formatTime(appointment.scheduled_start)}
            </p>
            {petName && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <PawPrint className="h-3 w-3" />
                {petName}
              </p>
            )}
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
