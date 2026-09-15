import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Download, X } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentPhoto {
  id: string;
  image_url: string;
  thumbnail_url: string;
  caption: string;
}

interface Props {
  appointmentId: string;
}

/**
 * F-H2: galería de fotos de la sesión Doggo Foto para el cliente.
 * Grid de thumbnails; click abre lightbox full-size. Botón
 * "Descargar todas" pega al endpoint /photos/download-all/ que
 * devuelve un zip.
 *
 * Si la cita no tiene fotos aún, mostramos un empty state que
 * explica que las fotos aparecen aquí después de la sesión (no
 * un placeholder gris o error confuso).
 */
export function SessionPhotosGallery({ appointmentId }: Props) {
  const [lightbox, setLightbox] = useState<AppointmentPhoto | null>(null);

  const query = useQuery({
    queryKey: ["session-photos", appointmentId] as const,
    queryFn: async () => {
      const res = await api.get<AppointmentPhoto[]>(
        `/appointments/${appointmentId}/photos/`,
      );
      return res.data;
    },
  });

  const photos = query.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-primary" />
          Tus fotos de la sesión
          {photos.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {photos.length}
            </span>
          )}
        </CardTitle>
        {photos.length > 0 && (
          <Button asChild size="sm" variant="outline">
            {/* Descarga directa — el backend responde con
                Content-Disposition attachment y el browser
                dispara el save-as. */}
            <a
              href={`${
                import.meta.env.VITE_API_BASE_URL ?? "/api"
              }/appointments/${appointmentId}/photos/download-all/`}
              rel="noreferrer"
            >
              <Download className="mr-1 h-4 w-4" />
              Descargar todas
            </a>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-3">
              <Camera className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">
              Aún no hay fotos disponibles
            </p>
            <p className="max-w-xs text-xs">
              Después de tu sesión en Doggo Foto, el equipo sube
              tus favoritas aquí. Te avisamos por email cuando
              estén listas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightbox(photo)}
                className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                aria-label={
                  photo.caption || "Ver foto en pantalla completa"
                }
              >
                <img
                  src={photo.thumbnail_url}
                  alt={photo.caption || "Foto de la sesión"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {/* Lightbox: fondo oscuro fullscreen con la imagen original. */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption || "Foto ampliada"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Cerrar"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox.image_url}
            alt={lightbox.caption || "Foto ampliada"}
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
}
