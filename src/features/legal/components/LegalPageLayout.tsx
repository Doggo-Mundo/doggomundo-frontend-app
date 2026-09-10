import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  /** Fecha en YYYY-MM-DD que el equipo legal fechó el doc. */
  effectiveDate: string;
  /** Versión — debe coincidir con `LEGAL_DOC_VERSIONS` del backend. */
  version: string;
  children: React.ReactNode;
}

/**
 * F-G.2: shell compartido para las páginas /legal/*. Mantiene
 * layout consistente (título, metadata versión + fecha, prose
 * tipográfico legible en desktop y móvil, botón "Volver").
 *
 * El copy vive en el archivo de cada página como prose HTML;
 * este layout solo lo enmarca. Cuando el despacho legal entregue
 * el copy final, se reemplaza el contenido de cada página sin
 * tocar este layout.
 */
export function LegalPageLayout({ title, effectiveDate, version, children }: Props) {
  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: "var(--surface-soft)",
        paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/register">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <article className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
          <header className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Versión {version} · Vigente desde {effectiveDate}
            </p>
          </header>

          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            {children}
          </div>

          {/* Aviso de placeholder — se elimina cuando entre el copy real */}
          <div className="mt-8 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/10 dark:text-amber-100">
            <strong>Aviso:</strong> este documento es un borrador
            operativo. La versión definitiva la revisa y firma el
            despacho legal antes de salir a producción.
          </div>
        </article>
      </div>
    </div>
  );
}
