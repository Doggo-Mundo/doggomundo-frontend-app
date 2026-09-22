import { Link } from "react-router-dom";
import { Camera, ChevronRight, ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPhotoSessions } from "@/features/appointments/lib/photo-sessions";
import { formatLongDate } from "@/lib/format-date";

/**
 * Índice del álbum del cliente — lista todas sus sesiones con
 * fotos, más recientes primero. Cada card lleva al detalle con
 * lightbox. Sustituye el flujo antiguo "Mis citas → cita → detalle
 * → gallery", que estaba a 4 clicks.
 */
export function MyPhotosPage() {
  const { data, isLoading, isError, refetch } = useMyPhotoSessions();
  const sessions = data ?? [];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mis fotos</h1>
        <p className="text-sm text-muted-foreground">
          Recuerdos de cada sesión de tu perro en Doggo Mundo.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<ImageIcon className="h-8 w-8" />}
          title="No pudimos cargar tus fotos"
          description="Revisa tu conexión e intenta de nuevo."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Reintentar
            </button>
          }
        />
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          icon={<Camera className="h-8 w-8" />}
          title="Aún no tienes fotos"
          description="Después de tu próxima sesión en Doggo Foto (o cualquier visita donde te tomen fotos), aparecerán aquí."
        />
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                to={`/my/photos/${session.id}`}
                className="group relative flex overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {/* Cover al 40% del ancho — proporción de foto real
                    con thumbnail cuadrado del backend. Placeholder
                    con gradient si la sesión aún no tiene cover
                    (raro pero posible en fotos legacy sin thumb). */}
                <div className="relative aspect-square w-32 shrink-0 bg-muted sm:w-40">
                  {session.cover_url ? (
                    <img
                      src={session.cover_url}
                      alt={
                        session.business_unit_name
                          ? `Portada — ${session.business_unit_name}`
                          : "Portada de la sesión"
                      }
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                    {session.photo_count}{" "}
                    {session.photo_count === 1 ? "foto" : "fotos"}
                  </span>
                </div>

                <div className="flex flex-1 items-center justify-between gap-2 p-4">
                  <div className="min-w-0 space-y-1">
                    {session.business_unit_name && (
                      <p className="truncate text-sm font-semibold text-foreground">
                        {session.business_unit_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatLongDate(session.scheduled_start)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
