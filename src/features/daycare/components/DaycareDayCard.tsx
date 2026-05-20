import { Link } from "react-router-dom";
import { Calendar, ChevronRight, MapPin, PawPrint } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { DayStatusBadge } from "./DayStatusBadge";
import type { DaycareDayListItem } from "@/types/daycare";

interface Props {
  day: DaycareDayListItem;
}

export function DaycareDayCard({ day }: Props) {
  return (
    <Link
      to={`/daycare/days/${day.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 truncate font-medium capitalize">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {format(parseISO(day.date), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <DayStatusBadge
                status={day.status}
                label={day.status_display}
              />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {day.location_name}
              <PawPrint className="ml-1 h-3 w-3" />
              {day.pet_name}
            </p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
