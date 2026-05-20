import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyCalendarIllustration } from "@/components/shared/illustrations/EmptyCalendarIllustration";
import { AppointmentListSkeleton } from "@/components/shared/skeletons/AppointmentCardSkeleton";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { partitionAppointments } from "@/features/appointments/lib/filter";
import { useMyAppointments } from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "past";

export function MyAppointmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data, isLoading, isError } = useMyAppointments();
  const { data: petsData } = usePets();

  const { upcoming, past } = useMemo(
    () => partitionAppointments(data?.results ?? []),
    [data],
  );

  const petNames = useMemo(() => {
    const map = new Map<string, string>();
    (petsData?.results ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [petsData]);

  const items = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mis citas</h1>
          <p className="text-sm text-muted-foreground">
            Próximas y pasadas.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/book">
            <Plus />
            Reservar
          </Link>
        </Button>
      </header>

      <div className="flex rounded-lg bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={tab === "upcoming"}
        >
          Próximas {upcoming.length > 0 && `(${upcoming.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "past"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={tab === "past"}
        >
          Pasadas
        </button>
      </div>

      {isLoading ? (
        <AppointmentListSkeleton rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus citas" />
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<EmptyCalendarIllustration />}
          title={
            tab === "upcoming"
              ? "No tienes citas próximas"
              : "Sin citas pasadas"
          }
          description={
            tab === "upcoming"
              ? "Reserva una para que aparezca aquí."
              : undefined
          }
          action={
            tab === "upcoming" ? (
              <Button asChild>
                <Link to="/book">
                  <Plus />
                  Reservar
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentCard
                appointment={appointment}
                petName={
                  appointment.pet ? petNames.get(appointment.pet) ?? null : null
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
