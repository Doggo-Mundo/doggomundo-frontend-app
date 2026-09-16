import { Navigate, useParams } from "react-router-dom";
import { Syringe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { PetsBreadcrumb } from "@/features/pets/components/PetsBreadcrumb";
import { CartillaReviewCard } from "@/features/pets/components/CartillaReviewCard";
import {
  usePet,
  usePetDocuments,
  usePetVaccinations,
} from "@/api/hooks/use-pets";
import { formatDate } from "@/lib/format-date";
import type { PetDocument } from "@/types/pet";

export function VaccinationsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet } = usePet(id ?? "");
  const { data: vaccinationsData, isLoading, isError } = usePetVaccinations(
    id ?? "",
  );
  // F-I: los documentos también viven acá — la cartilla es la
  // vía primaria para cargar vacunas. usePetDocuments auto-pollea
  // si hay alguna cartilla PENDING/PROCESSING.
  const { data: docsData } = usePetDocuments(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  const latestCartilla = findLatestCartilla(docsData?.results ?? []);

  return (
    <div className="space-y-4">
      <PetsBreadcrumb petId={id} petName={pet?.name} />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Vacunas</h1>
        <p className="text-sm text-muted-foreground">
          Sube tu cartilla y nosotros extraemos las vacunas automáticamente.
        </p>
      </header>

      <CartillaReviewCard petId={id} latestCartilla={latestCartilla} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Vacunas registradas
        </h2>
        {isLoading ? (
          <LoadingState rows={2} />
        ) : isError ? (
          <p className="text-sm text-rose-700">
            No pudimos cargar las vacunas.
          </p>
        ) : !vaccinationsData || vaccinationsData.results.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <Syringe className="h-5 w-5" />
              Aún no hay vacunas registradas.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {vaccinationsData.results.map((v) => (
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
      </section>
    </div>
  );
}

/** Devuelve la cartilla más reciente del pet, o null si no hay.
 *  El backend ya ordena por uploaded_date desc, así que tomamos la
 *  primera. */
function findLatestCartilla(docs: PetDocument[]): PetDocument | null {
  return (
    docs.find(
      (d) => d.document_type === "CARTILLA_VACUNACION" && d.is_active,
    ) ?? null
  );
}
