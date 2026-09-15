import { useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MAX_DOCUMENT_PAGES,
  useUploadPetDocument,
} from "@/api/hooks/use-pets";

interface CartillaUploaderProps {
  petId: string;
  onUploaded?: () => void;
}

/** F-I: card compacto para subir una cartilla desde la sección de
 *  documentos del pet. Acepta hasta MAX_DOCUMENT_PAGES fotos (frente,
 *  reverso, páginas extra). El backend dispara el pipeline VLM en
 *  background — el chip de estado se actualiza solo vía polling. */
export function CartillaUploader({ petId, onUploaded }: CartillaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const upload = useUploadPetDocument(petId);
  const canUpload = files.length > 0 && !upload.isPending;
  const canAddMore = files.length < MAX_DOCUMENT_PAGES;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;

    const remaining = MAX_DOCUMENT_PAGES - files.length;
    if (picked.length > remaining) {
      toast.error(
        `Solo puedes subir ${MAX_DOCUMENT_PAGES} páginas. Se agregaron las primeras ${remaining}.`,
      );
    }
    const accepted: File[] = [];
    for (const f of picked.slice(0, remaining)) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" excede 10 MB.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  }

  function removeAt(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (!files.length) return;
    const [primary, ...rest] = files;
    try {
      await upload.mutateAsync({
        document_type: "CARTILLA_VACUNACION",
        file: primary,
        additional_files: rest,
      });
      toast.success("¡Cartilla subida! La estamos leyendo automáticamente.");
      setFiles([]);
      onUploaded?.();
    } catch {
      toast.error("No pudimos subir la cartilla. Intenta otra vez.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subir cartilla</CardTitle>
        <CardDescription>
          Puedes agregar hasta {MAX_DOCUMENT_PAGES} páginas (frente,
          reverso, hojas extra).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-16 flex-col gap-1"
            disabled={!canAddMore}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.removeAttribute("multiple");
                inputRef.current.click();
              }
            }}
          >
            <Camera className="h-4 w-4" />
            <span className="text-xs">Tomar foto</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-16 flex-col gap-1"
            disabled={!canAddMore}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute("capture");
                inputRef.current.setAttribute("multiple", "true");
                inputRef.current.click();
              }
            }}
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs">Subir archivo</span>
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handlePick}
        />

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Pág. {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Quitar"
                  onClick={() => removeAt(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <Button
            type="button"
            className="w-full"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo…
              </>
            ) : (
              `Subir cartilla${files.length > 1 ? ` (${files.length} páginas)` : ""}`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
