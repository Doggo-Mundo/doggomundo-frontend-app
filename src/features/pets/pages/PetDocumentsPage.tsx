import { Navigate, useParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import { usePet, usePetDocuments } from "@/api/hooks/use-pets";

export function PetDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet } = usePet(id ?? "");
  const { data, isLoading, isError } = usePetDocuments(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  return (
    <div className="space-y-4">
      <BackLink to={`/pets/${id}`} label={pet?.name ?? "Volver"} />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Archivos asociados al perfil clínico.
        </p>
      </header>

      {isLoading ? (
        <LoadingState rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar los documentos" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Sin documentos"
          description="Los archivos que suba el equipo aparecerán aquí."
        />
      ) : (
        <ul className="space-y-3">
          {data.results.map((doc) => (
            <li key={doc.id}>
              <Card size="sm">
                <CardContent className="flex items-center gap-3 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.document_type_display}
                    </p>
                  </div>
                  {doc.file && (
                    <Button
                      asChild
                      size="icon-sm"
                      variant="outline"
                      aria-label="Descargar"
                    >
                      <a href={doc.file} target="_blank" rel="noreferrer">
                        <Download />
                      </a>
                    </Button>
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
