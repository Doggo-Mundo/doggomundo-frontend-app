import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  /** ID de la mascota — se linkea al detail. */
  petId: string;
  /** Nombre de la mascota. `undefined` mientras la query carga
   *  del backend; en ese caso mostramos un placeholder discreto. */
  petName?: string;
}

/**
 * Breadcrumb para las subpáginas de una mascota (editar perfil,
 * cartilla, expediente, documentos). Muestra dos saltos clicables:
 *
 *   < Mis mascotas ›  Bobi
 *
 * Sin nombre de la subpágina — ese ya está en el `<h1>` debajo.
 * Con esto el usuario puede saltar directo a la lista (por ej.
 * para registrar otra mascota) sin retroceder pantalla por
 * pantalla.
 */
export function PetsBreadcrumb({ petId, petName }: Props) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        to="/pets"
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Mis mascotas
      </Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      <Link
        to={`/pets/${petId}`}
        className="hover:text-foreground"
      >
        {petName ?? "Mascota"}
      </Link>
    </nav>
  );
}
