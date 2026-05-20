import { Navigate, useParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import { usePet, usePetMedicalRecords } from "@/api/hooks/use-pets";
import { formatDate } from "@/lib/format-date";

export function MedicalRecordsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet } = usePet(id ?? "");
  const { data, isLoading, isError } = usePetMedicalRecords(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  return (
    <div className="space-y-4">
      <BackLink to={`/pets/${id}`} label={pet?.name ?? "Volver"} />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Historial médico</h1>
        <p className="text-sm text-muted-foreground">
          Registros cargados por el equipo veterinario.
        </p>
      </header>

      {isLoading ? (
        <LoadingState rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar el historial" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-12 w-12" />}
          title="Sin registros aún"
          description="Los registros médicos que haga el equipo veterinario aparecerán aquí."
        />
      ) : (
        <ul className="space-y-3">
          {data.results.map((record) => (
            <li key={record.id}>
              <Card size="sm">
                <CardContent className="space-y-2 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{record.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.record_type_display} · {formatDate(record.date)}
                      </p>
                    </div>
                  </div>
                  {record.description && (
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {record.description}
                    </p>
                  )}
                  {record.veterinarian && (
                    <p className="text-xs text-muted-foreground">
                      Vet: {record.veterinarian}
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
