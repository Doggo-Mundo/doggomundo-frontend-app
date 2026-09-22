import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SessionPhotosGallery } from "@/features/appointments/components/SessionPhotosGallery";

/**
 * Detalle de una sesión de fotos: reusa el `SessionPhotosGallery`
 * (grid + lightbox + descarga) que ya vivía en el detalle de la
 * cita. Ahora accesible directo desde /my/photos sin pasar por la
 * cita.
 */
export function PhotoSessionDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Link
        to="/my/photos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas las sesiones
      </Link>

      <SessionPhotosGallery appointmentId={id} />
    </div>
  );
}
