import type { ReactNode } from "react";
import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

const ORIGINAL_IMAGE_SRC = "/legal/codigo-de-la-manada.png";

// Paleta local del documento — inspirada en el PDF branded que
// armó el equipo. Se queda inline (no en tokens globales) porque
// solo se usa en esta página; si mañana se estandariza como tema
// legal, promovemos a variables CSS.
const COLORS = {
  navy: "#1e3a72",
  navySoft: "#eef2fb",
  navyBadge: "#3b5bdb",
  coral: "#e56d5f",
  coralSoft: "#fdf2f0",
  coralBadge: "#e56d5f",
  border: "rgba(0,0,0,0.06)",
} as const;

/**
 * F-G.4: Código de la Manada — reglas de convivencia del espacio
 * Doggo Mundo que cada cliente acepta al registrarse.
 *
 * ESTA ES UNA TRANSCRIPCIÓN HTML del PDF-imagen entregado por
 * Jackie (que vive en /public/legal/codigo-de-la-manada.png). El
 * copy debe empatarse 1:1 con la imagen — al pie linkeamos el
 * archivo original para que quien revise pueda cotejar.
 *
 * Correcciones respecto a la imagen (typos evidentes):
 * - Regla 1 · punto 5: "incumplir" → "cumplir".
 * - Regla 3 · párrafo 1: "accidents" → "accidentes".
 * - "Doggomundo" normalizado a "Doggo Mundo" para consistencia
 *   con el resto de la app (misma marca, sin cambio de fondo).
 *
 * Cuando el despacho legal firme la versión definitiva, se
 * reemplaza este copy y se sube la variante en `LEGAL_DOC_VERSIONS`.
 */
export function PackCodePage() {
  return (
    <LegalPageLayout
      title="Código de la Manada"
      version="1.0"
      effectiveDate="2026-09-28"
    >
      <p>
        Tu perro está listo. Te toca leer y firmar. Estas son las
        reglas de convivencia del espacio Doggo Mundo — al
        aceptarlas te comprometes a cuidar el espacio, a tu Doggo y
        a los demás Doggos y humanos que conviven ahí.
      </p>

      <p>
        Al aceptar este código como parte de tu registro digital,
        declaras ser propietario, poseedor y/o responsable del o
        los perros que registres en Doggo Mundo, y manifiestas bajo
        protesta de decir verdad lo siguiente:
      </p>

      <Rule number={1} title="Mi perro está sano y listo para divertirse">
        <Point n={1} title="Soy el responsable" tone="navy">
          Confirmo que soy la persona responsable de mi(s) perro(s)
          y que cuento con las facultades necesarias para aceptar y
          firmar este acuerdo.
        </Point>
        <Point n={2} title="Buen estado de salud" tone="coral">
          Declaro que mi(s) perro(s) se encuentra(n) en buen estado
          de salud y no presenta(n) enfermedades contagiosas ni
          alergias, enfermedades crónicas, padecimientos cardiacos
          o respiratorios, epilepsia, medicamentos, tratamientos o
          limitaciones físicas que puedan representar un riesgo
          para otros perros, usuarios, colaboradores o
          instalaciones de Doggo Mundo. Confirmo que mi(s) perro(s)
          está(n) libre(s) de pulgas, garrapatas u otras
          infestaciones.
        </Point>
        <Point n={3} title="Vacunación vigente" tone="navy">
          Confirmo que mi(s) perro(s) cuenta(n) con su esquema de
          vacunación vigente o, en su caso, que he solicitado o
          solicitaré la aplicación de las vacunas correspondientes
          a través de los servicios ofrecidos en Doggo Mundo.
        </Point>
        <Point n={4} title="Antecedentes de agresión" tone="coral">
          Si mi(s) perro(s) tiene(n) antecedentes de agresión,
          mordeduras o algún comportamiento que deba conocerse por
          seguridad, me comprometo a informarlo previamente a Doggo
          Mundo.
        </Point>
        <Point n={5} title="Celo" tone="coral">
          Por seguridad, las hembras en celo no podrán ingresar a
          Doggo Mundo y será responsabilidad del Usuario cumplir
          esta regla.
        </Point>
      </Rule>

      <Rule number={2} title="Mi humano cuida de mí">
        <Point n={7} label="Punto 7" title="Responsabilidad total" tone="navy">
          Durante nuestra visita, soy responsable del
          comportamiento, cuidado, supervisión, control, salud y
          bienestar de mi(s) perro(s).
        </Point>
        <Point n={8} label="Punto 8" title="Control y correa" tone="coral">
          Mantendré a mi(s) perro(s) bajo control y con correa
          cuando corresponda. Podrá(n) estar sin ella únicamente en
          las áreas o servicios donde Doggo Mundo expresamente lo
          permita, como Doggo Explore, Doggo Studio o Doggo
          Bath/Groom mientras dura el servicio.
        </Point>
        <Point n={9} label="Punto 9" title="Limpieza" tone="navy">
          Si mi(s) perro(s) hace(n) sus necesidades dentro de las
          instalaciones, me encargaré de limpiar el área utilizando
          los suministros que Doggo Mundo ponga a mi disposición.
        </Point>
        <Point n={10} label="Punto 10" title="Alimentación" tone="coral">
          Soy responsable de decidir y supervisar los productos,
          alimentos o premios que consuma(n) mi(s) perro(s) durante
          nuestra visita.
        </Point>
      </Rule>

      <Rule number={3} title="Nos gusta disfrutar, pero somos perros">
        <Prose tone="coral">
          Estoy consciente de que los servicios y espacios de Doggo
          Mundo están diseñados para disfrutarse responsablemente y
          que la convivencia con animales y el uso de determinados
          equipos implican riesgos inherentes como interacciones
          inesperadas entre perros; estrés, ansiedad o conductas
          impredecibles; reacciones a productos o alimentos; así
          como cortaduras, irritaciones o accidentes leves durante
          el uso de maquinaria, servicios de estética, áreas
          húmedas o equipo especializado.
        </Prose>
        <Prose tone="navy">
          Entiendo que incluso perros normalmente tranquilos pueden
          reaccionar de manera inesperada ante otros animales,
          personas, sonidos, espacios o estímulos.
        </Prose>
        <Prose tone="coral">
          Por ello, acepto los riesgos inherentes derivados de la
          convivencia entre perros y del uso adecuado de las
          instalaciones y servicios de Doggo Mundo.
        </Prose>
      </Rule>

      <Rule number={4} title="Mi humano es responsable">
        <Point n={1} title="Autoservicio, asistencia o personal" tone="navy">
          Algunos servicios pueden ser de autoservicio, asistencia
          limitada o contar con intervención de nuestro personal.
          Seguiré las instrucciones proporcionadas y seré
          responsable del uso correcto de los equipos cuando me
          corresponda.
        </Point>
        <Point n={2} title="Sin guarda ni custodia" tone="coral">
          Entiendo que Doggo Mundo no asume la guarda, custodia,
          depósito o posesión de mi(s) perro(s), salvo que algún
          servicio contratado establezca expresamente algo
          distinto.
        </Point>
        <Point n={3} title="Uso inadecuado" tone="navy">
          El uso inadecuado, negligente o contrario a las
          instrucciones de equipos, instalaciones o servicios será
          responsabilidad del Usuario.
        </Point>
        <Point n={4} title="Deslinde de responsabilidad" tone="coral">
          En la medida permitida por la legislación aplicable,
          libero y deslindo a Doggo Mundo, sus socios,
          administradores, empleados, proveedores y colaboradores
          de responsabilidad por daños o incidentes derivados de
          riesgos propios e inevitables de la convivencia entre
          perros y del uso no adecuado, negligente o distinto al
          previsto de los equipos, instalaciones o servicios, ya
          sean daños materiales, lesiones a mi(s) perro(s), a mí, a
          terceros o a otros animales. Asimismo, exceptúo a Doggo
          Mundo de cualquier responsabilidad por pérdida, robo,
          huida o desaparición de mi(s) perro(s), salvo en los
          casos en que exista dolo o culpa grave comprobada de su
          parte.
        </Point>
      </Rule>

      <p style={{ marginTop: "2rem", fontSize: "0.85em", color: "var(--muted-foreground)" }}>
        ¿Quieres revisar el documento original con la identidad
        visual completa?{" "}
        <a href={ORIGINAL_IMAGE_SRC} target="_blank" rel="noopener noreferrer">
          Abrir el PDF-imagen entregado por el equipo
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes de estructura
// ---------------------------------------------------------------------------

interface RuleProps {
  number: number;
  title: string;
  children: ReactNode;
}

/** Bloque "REGLA N" con la píldora coral + título navy grande. */
function Rule({ number, title, children }: RuleProps) {
  return (
    <section
      className="not-prose"
      style={{ marginTop: "2.5rem", marginBottom: "0.5rem" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.9rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: COLORS.coral,
            borderRadius: "9999px",
          }}
        >
          Regla {number}
        </span>
      </div>
      <h2
        style={{
          marginTop: "0.5rem",
          marginBottom: "1rem",
          fontSize: "1.5rem",
          fontWeight: 700,
          lineHeight: 1.15,
          color: COLORS.navy,
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </section>
  );
}

interface PointProps {
  /** Número que se pinta en la píldora circular. */
  n: number;
  /** Etiqueta opcional arriba del título (ej. "Punto 7"). */
  label?: string;
  title: string;
  tone: "navy" | "coral";
  children: ReactNode;
}

/** Tarjeta numerada con badge circular + título en bold + copy. */
function Point({ n, label, title, tone, children }: PointProps) {
  const bg = tone === "navy" ? COLORS.navySoft : COLORS.coralSoft;
  const badge = tone === "navy" ? COLORS.navyBadge : COLORS.coralBadge;
  return (
    <div
      className="not-prose"
      style={{
        display: "flex",
        gap: "0.85rem",
        padding: "1rem",
        background: bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "0.75rem",
      }}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: "2.25rem",
          height: "2.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: badge,
          color: "#ffffff",
          borderRadius: "9999px",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        {n}
      </div>
      <div>
        {label && (
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: COLORS.navy,
              opacity: 0.65,
              marginBottom: "0.15rem",
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            color: COLORS.navy,
            marginBottom: "0.35rem",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "0.95rem", lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>
  );
}

interface ProseProps {
  tone: "navy" | "coral";
  children: ReactNode;
}

/** Bloque de párrafo con fondo tenue (para Regla 3, que es prose
 *  corrido sin numerar). Mismo look que Point pero sin badge. */
function Prose({ tone, children }: ProseProps) {
  const bg = tone === "navy" ? COLORS.navySoft : COLORS.coralSoft;
  return (
    <div
      className="not-prose"
      style={{
        padding: "1rem",
        background: bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "0.75rem",
        fontSize: "0.95rem",
        lineHeight: 1.55,
        color: COLORS.navy,
      }}
    >
      {children}
    </div>
  );
}
