import { Navigate, useParams } from "react-router-dom";
import { Download, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PetsBreadcrumb } from "@/features/pets/components/PetsBreadcrumb";
import { VlmStatusChip } from "@/features/pets/components/VlmStatusChip";
import {
  useRetryExtraction,
  usePet,
  usePetDocuments,
} from "@/api/hooks/use-pets";
import type { PetDocument } from "@/types/pet";

export function PetDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet } = usePet(id ?? "");
  const { data, isLoading, isError } = usePetDocuments(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  return (
    <div className="space-y-4">
      <PetsBreadcrumb petId={id} petName={pet?.name} />

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
              <DocumentRow petId={id} doc={doc} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface DocumentRowProps {
  petId: string;
  doc: PetDocument;
}

function DocumentRow({ petId, doc }: DocumentRowProps) {
  const retry = useRetryExtraction(petId, doc.id);
  const totalPages = 1 + (doc.pages?.length ?? 0);

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 py-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">
              {doc.document_type_display}
            </p>
            <VlmStatusChip status={doc.vlm_extraction_status} />
            {totalPages > 1 && (
              <span
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                title={`${totalPages} páginas`}
              >
                {totalPages} pág.
              </span>
            )}
          </div>
          {doc.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {doc.description}
            </p>
          )}
          {doc.vlm_extraction_status === "FAILED" && (
            <p className="mt-1 truncate text-xs text-rose-700">
              No pudimos leer la cartilla automáticamente.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {doc.vlm_extraction_status === "FAILED" && (
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Reintentar extracción"
              disabled={retry.isPending}
              onClick={() => retry.mutate()}
            >
              <RotateCcw />
            </Button>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
