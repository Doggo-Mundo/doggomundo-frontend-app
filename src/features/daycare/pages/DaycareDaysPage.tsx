import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyCalendarIllustration } from "@/components/shared/illustrations/EmptyCalendarIllustration";
import { LoadingState } from "@/components/shared/LoadingState";
import { BackLink } from "@/features/pets/components/BackLink";
import { DaycareDayCard } from "@/features/daycare/components/DaycareDayCard";
import { useDays } from "@/api/hooks/use-daycare";
import { cn } from "@/lib/utils";
import type { DaycareDayListItem } from "@/types/daycare";

type Tab = "upcoming" | "history";

const UPCOMING_STATUSES = new Set<DaycareDayListItem["status"]>([
  "scheduled",
  "checked_in",
]);

export function DaycareDaysPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data, isLoading, isError } = useDays();

  const { upcoming, history } = useMemo(() => {
    const all = data?.results ?? [];
    const up: DaycareDayListItem[] = [];
    const hist: DaycareDayListItem[] = [];
    for (const d of all) {
      if (UPCOMING_STATUSES.has(d.status)) up.push(d);
      else hist.push(d);
    }
    up.sort((a, b) => a.date.localeCompare(b.date));
    hist.sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming: up, history: hist };
  }, [data]);

  const items = tab === "upcoming" ? upcoming : history;

  return (
    <div className="space-y-4">
      <BackLink to="/daycare" label="Day Care" />

      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mis días</h1>
          <p className="text-sm text-muted-foreground">
            Próximas reservas e historial en day care.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/daycare/book">
            <Plus />
            Reservar
          </Link>
        </Button>
      </header>

      <div className="flex rounded-lg bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          aria-pressed={tab === "upcoming"}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Próximas{upcoming.length > 0 && ` (${upcoming.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          aria-pressed={tab === "history"}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Historial
        </button>
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus días" />
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<EmptyCalendarIllustration />}
          title={
            tab === "upcoming" ? "No tienes días próximos" : "Sin historial"
          }
          description={
            tab === "upcoming"
              ? "Reserva uno y aparecerá aquí."
              : "Tus días completados aparecerán aquí."
          }
          action={
            tab === "upcoming" ? (
              <Button asChild>
                <Link to="/daycare/book">
                  <Plus />
                  Reservar día
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.id}>
              <DaycareDayCard day={d} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
