import { FlaskConical } from "lucide-react";
import { isTestEnvironment } from "@/lib/environment";

interface Props {
  /** Para tests; por default se detecta solo. */
  isTest?: boolean;
}

/** Franja amarilla (`--sun`) que marca el ambiente de pruebas. No se puede
 *  cerrar a propósito: es justo lo que evita confundirlo con producción. */
export function EnvironmentBanner({ isTest = isTestEnvironment() }: Props) {
  if (!isTest) return null;
  return (
    <div
      role="status"
      aria-label="Ambiente de pruebas"
      className="flex items-center justify-center gap-2 bg-sun px-4 py-1 text-center text-xs font-semibold text-primary"
    >
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span>Ambiente de pruebas · los datos y pagos no son reales</span>
    </div>
  );
}
