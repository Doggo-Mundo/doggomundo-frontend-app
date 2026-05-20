import { Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyPawsIllustration } from "@/components/shared/illustrations/EmptyPawsIllustration";
import { DaycarePlanCard } from "@/features/daycare/components/DaycarePlanCard";
import { PetEvaluationCard } from "@/features/daycare/components/PetEvaluationCard";
import { ActiveEnrollmentStrip } from "@/features/daycare/components/ActiveEnrollmentStrip";
import { useEnrollments, usePlans } from "@/api/hooks/use-daycare";
import { usePets } from "@/api/hooks/use-pets";
import type { DaycareEnrollmentList } from "@/types/daycare";

export function DaycareLandingPage() {
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: petsData, isLoading: petsLoading } = usePets();

  const activeEnrollments: DaycareEnrollmentList[] =
    enrollmentsData?.results.filter((e) => e.status === "active") ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent-foreground">
          <Sun className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            Doggo Day Care
          </span>
        </div>
        <h1 className="text-2xl font-semibold">
          Tu peludo en buenas patas todo el día
        </h1>
        <p className="text-sm text-muted-foreground">
          Déjalo con nosotros mientras trabajas. Socializa, juega y descansa en
          un espacio diseñado para él.
        </p>
      </header>

      {!enrollmentsLoading && activeEnrollments.length > 0 && (
        <section className="space-y-2">
          {activeEnrollments.map((e) => (
            <ActiveEnrollmentStrip key={e.id} enrollment={e} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tus mascotas
        </h2>
        {petsLoading ? (
          <LoadingState rows={2} />
        ) : !petsData || petsData.results.length === 0 ? (
          <EmptyState
            illustration={<EmptyPawsIllustration />}
            title="Aún no registras mascotas"
            description="Agrega una mascota antes de inscribirla al day care."
          />
        ) : (
          <ul className="space-y-2">
            {petsData.results
              .filter((p) => p.is_active)
              .map((pet) => (
                <li key={pet.id}>
                  <PetEvaluationCard pet={pet} />
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Planes disponibles
        </h2>
        {plansLoading ? (
          <LoadingState rows={3} />
        ) : !plansData || plansData.results.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Pronto habrá planes disponibles en tu sucursal.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {plansData.results.map((plan) => (
              <li key={plan.id}>
                <DaycarePlanCard plan={plan} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
