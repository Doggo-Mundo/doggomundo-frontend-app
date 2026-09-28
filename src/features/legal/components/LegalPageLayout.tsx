interface Props {
  title: string;
  /** Fecha en YYYY-MM-DD que el equipo legal fechó el doc. */
  effectiveDate: string;
  /** Versión — debe coincidir con `LEGAL_DOC_VERSIONS` del backend. */
  version: string;
  /** Oculta el aviso de "borrador operativo" del pie. Úsalo cuando
   *  la página ya está sirviendo copy final (imagen o texto que
   *  entregó el cliente / despacho legal). */
  hidePlaceholderNotice?: boolean;
  children: React.ReactNode;
}

/**
 * F-G.2: shell compartido para las páginas /legal/*. Mantiene
 * layout consistente (título, metadata versión + fecha, prose
 * tipográfico legible en desktop y móvil).
 *
 * Sin botón "Volver": los links a estas páginas abren en pestaña
 * nueva desde register/setup, y navegar dentro de la nueva pestaña
 * pierde el form ya lleno del usuario en la pestaña original. Para
 * regresar el usuario cierra la pestaña — comportamiento estándar
 * del navegador.
 *
 * El copy vive en el archivo de cada página como prose HTML; este
 * layout solo lo enmarca. Cuando el despacho legal entregue el
 * copy final, se reemplaza el contenido de cada página sin tocar
 * este layout.
 */
export function LegalPageLayout({
  title,
  effectiveDate,
  version,
  hidePlaceholderNotice = false,
  children,
}: Props) {
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

          {/* Aviso de placeholder — visible mientras el copy sea
              borrador operativo. Cada página lo puede apagar cuando
              ya sirve la versión final entregada por el cliente o
              el despacho legal. */}
          {!hidePlaceholderNotice && (
            <div className="mt-8 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/10 dark:text-amber-100">
              <strong>Aviso:</strong> este documento es un borrador
              operativo. La versión definitiva la revisa y firma el
              despacho legal antes de salir a producción.
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
