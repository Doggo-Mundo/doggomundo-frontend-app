import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

/**
 * F-G.4: Código de la Manada — reglas de convivencia del espacio
 * Doggo Mundo que cada cliente acepta al registrarse.
 *
 * PLACEHOLDER: hoy servimos la imagen que armó el equipo con
 * ChatGPT sobre el Word original de Jackie. Cuando llegue el PDF
 * o HTML final del diseñador se reemplaza:
 *
 * - Opción 1 (rápida): swap del archivo en
 *   `public/legal/codigo-de-la-manada.png` por la versión final.
 * - Opción 2 (mejor UX): transcribir el copy a componentes React
 *   con la identidad visual del landing (accesible, seleccionable,
 *   mobile-first).
 */
export function PackCodePage() {
  return (
    <LegalPageLayout
      title="Código de la Manada"
      version="1.0"
      effectiveDate="2026-09-28"
    >
      <p>
        Estas son las reglas de convivencia del espacio Doggo Mundo.
        Léelas con calma — al aceptarlas te comprometes a cuidar el
        espacio, a tu Doggo y a los demás Doggos y humanos que
        conviven ahí.
      </p>

      {/* Imagen del código de la manada. Placeholder visual del
          documento branded — el archivo vive en public/legal/
          y se puede reemplazar sin tocar código cuando llegue la
          versión final del diseñador. */}
      <div
        style={{
          margin: "1.5rem 0",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <img
          src="/legal/codigo-de-la-manada.png"
          alt="Código de la Manada — reglas de convivencia del espacio Doggo Mundo"
          style={{ display: "block", width: "100%", height: "auto" }}
          loading="eager"
        />
      </div>

      <p style={{ fontSize: "0.9em", color: "var(--muted-foreground)" }}>
        ¿No puedes ver la imagen?{" "}
        <a
          href="/legal/codigo-de-la-manada.png"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir en pestaña nueva
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
