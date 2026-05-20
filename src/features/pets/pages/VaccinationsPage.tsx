import { Navigate, useParams } from "react-router-dom";
import { Syringe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import { usePet, usePetVaccinations } from "@/api/hooks/use-pets";
import { formatDate } from "@/lib/format-date";

export function VaccinationsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet } = usePet(id ?? "");
  const { data, isLoading, isError } = usePetVaccinations(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  return (
    <div className="space-y-4">
      <BackLink to={`/pets/${id}`} label={pet?.name ?? "Volver"} />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Vacunas</h1>
        <p className="text-sm text-muted-foreground">
          Aplicadas y próximas dosis.
        </p>
      </header>

      {isLoading ? (
        <LoadingState rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar las vacunas" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<Syringe className="h-12 w-12" />}
          title="Sin vacunas registradas"
          description="Cuando el equipo veterinario cargue vacunas, aparecerán aquí."
        />
      ) : (
        <ul className="space-y-3">
          {data.results.map((v) => (
            <li key={v.id}>
              <Card size="sm">
                <CardContent className="space-y-1 py-3">
                  <p className="text-sm font-medium">{v.vaccine_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Aplicada: {formatDate(v.administered_date)}
                    {v.next_due_date && (
                      <> · Próxima: {formatDate(v.next_due_date)}</>
                    )}
                  </p>
                  {v.batch_number && (
                    <p className="text-xs text-muted-foreground">
                      Lote: {v.batch_number}
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
