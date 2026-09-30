import "@fontsource-variable/fredoka";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  AlertTriangle,
  Bone,
  FileText,
  Heart,
  HeartPulse,
  Home,
  Link2,
  Settings,
  ShowerHead,
  Syringe,
  Trash2,
  UtensilsCrossed,
  Venus,
} from "lucide-react";

/**
 * F-G.4: Código de la Manada — reglas de convivencia del espacio
 * Doggo Mundo que cada cliente acepta al registrarse.
 *
 * Esta página es una transcripción del PDF branded que armó
 * Jackie (vive en `/public/legal/codigo-de-la-manada.png`). Copy
 * fiel al original, con dos correcciones editoriales evidentes:
 *  - Regla 1 · punto 5: "incumplir" → "cumplir".
 *  - Regla 3 · párrafo 1: "accidents" → "accidentes".
 *  - "Doggomundo" normalizado a "Doggo Mundo".
 *
 * No usa `LegalPageLayout` — el look branded (paper cream, títulos
 * Fredoka, hand-drawn accents) es específico de este documento. El
 * link al PNG original queda al pie para que legal pueda cotejar
 * antes de dar por buena la versión definitiva.
 */

// -----------------------------------------------------------------
// Paleta + tipografía del documento
// -----------------------------------------------------------------

const NAVY = "#222D56";
const NAVY_SOFT = "#E7EEFA";
const NAVY_BADGE = "#3B5BDB";
const CORAL = "#E56D5F";
const CORAL_SOFT = "#FCEEE9";
const CORAL_BADGE = "#E56D5F";
const CREAM = "#FFF7EC";
const PAPER = "#FFFDF7";
const BORDER = "rgba(34, 45, 86, 0.08)";
const MUTED_INK = "rgba(34, 45, 86, 0.72)";

const FREDOKA = "'Fredoka Variable', 'Montserrat Variable', system-ui, sans-serif";
const BODY_FONT = "'Montserrat Variable', system-ui, sans-serif";

// -----------------------------------------------------------------
// Página
// -----------------------------------------------------------------

export function PackCodePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: BODY_FONT,
        paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cielo con nubes onduladas — decoración global tipo el
          PDF, se repite tenue detrás del contenido para dar
          textura y unidad al documento. */}
      <SkyDecorations />

      <div
        style={{
          margin: "0 auto",
          padding: "0 clamp(0.75rem, 2.5vw, 1.5rem)",
          position: "relative",
        }}
      >
        {/* Layout tipo masonry/Pinterest usando CSS multi-column:
            los paneles fluyen top-to-bottom llenando cada columna
            antes de saltar a la siguiente, así los paneles cortos
            (Cover, Preámbulo) NO dejan aire debajo — la siguiente
            regla se coloca ahí mismo. `column-width` deja al
            browser decidir cuántas columnas caben — 1 en mobile,
            2 en tablet, 4-5 en desktop wide. */}
        <div
          style={{
            columnWidth: "17rem",
            columnGap: "0.85rem",
          }}
        >
          <Panel accent="cover">
            <Cover />
          </Panel>

          <Panel>
            <Preamble />
          </Panel>

          <Panel>
        <Rule
          number={1}
          title={
            <>
              Mi perro está sano <br />
              y listo para divertirse
            </>
          }
        >
          <Point n={1} title="Soy el responsable" tone="navy" icon={Bone}>
            Confirmo que soy la persona responsable de mi(s) perro(s) y
            que cuento con las facultades necesarias para aceptar y
            firmar este acuerdo.
          </Point>
          <Point n={2} title="Buen estado de salud" tone="coral" icon={HeartPulse}>
            Declaro que mi(s) perro(s) se encuentra(n) en buen estado
            de salud y no presenta(n) enfermedades contagiosas ni
            alergias, enfermedades crónicas, padecimientos cardiacos
            o respiratorios, epilepsia, medicamentos, tratamientos o
            limitaciones físicas que puedan representar un riesgo
            para otros perros, usuarios, colaboradores o instalaciones
            de Doggo Mundo. Confirmo que mi(s) perro(s) está(n)
            libre(s) de pulgas, garrapatas u otras infestaciones.
          </Point>
          <Point n={3} title="Vacunación vigente" tone="navy" icon={Syringe}>
            Confirmo que mi(s) perro(s) cuenta(n) con su esquema de
            vacunación vigente o, en su caso, que he solicitado o
            solicitaré la aplicación de las vacunas correspondientes
            a través de los servicios ofrecidos en Doggo Mundo.
          </Point>
          <Point
            n={4}
            title="Antecedentes de agresión"
            tone="coral"
            icon={AlertTriangle}
          >
            Si mi(s) perro(s) tiene(n) antecedentes de agresión,
            mordeduras o algún comportamiento que deba conocerse por
            seguridad, me comprometo a informarlo previamente a Doggo
            Mundo.
          </Point>
          <Point n={5} title="Celo" tone="coral" icon={Venus}>
            Por seguridad, las hembras en celo no podrán ingresar a
            Doggo Mundo y será responsabilidad del Usuario cumplir
            esta regla.
          </Point>
        </Rule>
          </Panel>

          <Panel>
        <Rule number={2} title="Mi humano cuida de mí">
          <Point
            n={7}
            label="Punto 7"
            title="Responsabilidad total"
            tone="navy"
            icon={Bone}
          >
            Durante nuestra visita, soy responsable del comportamiento,
            cuidado, supervisión, control, salud y bienestar de mi(s)
            perro(s).
          </Point>
          <Point
            n={8}
            label="Punto 8"
            title="Control y correa"
            tone="coral"
            icon={Link2}
          >
            Mantendré a mi(s) perro(s) bajo control y con correa
            cuando corresponda. Podrá(n) estar sin ella únicamente en
            las áreas o servicios donde Doggo Mundo expresamente lo
            permita, como Doggo Explore, Doggo Studio o Doggo
            Bath/Groom mientras dura el servicio.
          </Point>
          <Point
            n={9}
            label="Punto 9"
            title="Limpieza"
            tone="navy"
            icon={Trash2}
          >
            Si mi(s) perro(s) hace(n) sus necesidades dentro de las
            instalaciones, me encargaré de limpiar el área utilizando
            los suministros que Doggo Mundo ponga a mi disposición.
          </Point>
          <Point
            n={10}
            label="Punto 10"
            title="Alimentación"
            tone="coral"
            icon={UtensilsCrossed}
          >
            Soy responsable de decidir y supervisar los productos,
            alimentos o premios que consuma(n) mi(s) perro(s) durante
            nuestra visita.
          </Point>
        </Rule>
          </Panel>

          <Panel>
        <Rule
          number={3}
          title={
            <>
              Nos gusta disfrutar, <br />
              pero somos perros
            </>
          }
        >
          <ProseCard tone="coral">
            Estoy consciente de que los servicios y espacios de Doggo
            Mundo están diseñados para disfrutarse responsablemente y
            que la convivencia con animales y el uso de determinados
            equipos implican riesgos inherentes como interacciones
            inesperadas entre perros; estrés, ansiedad o conductas
            impredecibles; reacciones a productos o alimentos; así
            como cortaduras, irritaciones o accidentes leves durante
            el uso de maquinaria, servicios de estética, áreas húmedas
            o equipo especializado.
          </ProseCard>
          <ProseCard tone="navy">
            Entiendo que incluso perros normalmente tranquilos pueden
            reaccionar de manera inesperada ante otros animales,
            personas, sonidos, espacios o estímulos.
          </ProseCard>
          <ProseCard tone="coral">
            Por ello, acepto los riesgos inherentes derivados de la
            convivencia entre perros y del uso adecuado de las
            instalaciones y servicios de Doggo Mundo.
          </ProseCard>
        </Rule>
          </Panel>

          <Panel>
        <Rule number={4} title="Mi humano es responsable">
          <Point
            n={1}
            title="Autoservicio, asistencia o personal"
            tone="navy"
            icon={ShowerHead}
          >
            Algunos servicios pueden ser de autoservicio, asistencia
            limitada o contar con intervención de nuestro personal.
            Seguiré las instrucciones proporcionadas y seré responsable
            del uso correcto de los equipos cuando me corresponda.
          </Point>
          <Point n={2} title="Sin guarda ni custodia" tone="coral" icon={Home}>
            Entiendo que Doggo Mundo no asume la guarda, custodia,
            depósito o posesión de mi(s) perro(s), salvo que algún
            servicio contratado establezca expresamente algo distinto.
          </Point>
          <Point n={3} title="Uso inadecuado" tone="navy" icon={Settings}>
            El uso inadecuado, negligente o contrario a las
            instrucciones de equipos, instalaciones o servicios será
            responsabilidad del Usuario.
          </Point>
          <Point
            n={4}
            title="Deslinde de responsabilidad"
            tone="coral"
            icon={FileText}
          >
            En la medida permitida por la legislación aplicable, libero
            y deslindo a Doggo Mundo, sus socios, administradores,
            empleados, proveedores y colaboradores de responsabilidad
            por daños o incidentes derivados de riesgos propios e
            inevitables de la convivencia entre perros y del uso no
            adecuado, negligente o distinto al previsto de los equipos,
            instalaciones o servicios, ya sean daños materiales,
            lesiones a mi(s) perro(s), a mí, a terceros o a otros
            animales. Asimismo, exceptúo a Doggo Mundo de cualquier
            responsabilidad por pérdida, robo, huida o desaparición
            de mi(s) perro(s), salvo en los casos en que exista dolo
            o culpa grave comprobada de su parte.
          </Point>
        </Rule>
          </Panel>
        </div>

        <Footer />

        <PlaceholderNotice />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// Panel (card individual del "tríptico")
// -----------------------------------------------------------------

interface PanelProps {
  /** Cuando es `cover` aplicamos padding más generoso y quitamos
   *  el tinte tenue del interior para que el título respire. */
  accent?: "cover" | "default";
  children: ReactNode;
}

function Panel({ accent = "default", children }: PanelProps) {
  const isCover = accent === "cover";
  return (
    <div
      style={{
        background: PAPER,
        borderRadius: "1.1rem",
        padding: isCover ? "1.15rem 1rem" : "0.9rem 0.85rem",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 4px 16px rgba(34, 45, 86, 0.05)",
        position: "relative",
        // masonry: evitar que el navegador parta un panel entre
        // columnas. `break-inside` cubre CSS multi-column moderna;
        // `pageBreakInside` es fallback para engines viejos que
        // aún respetan la vieja spec de impresión.
        breakInside: "avoid",
        pageBreakInside: "avoid",
        // `column-gap` solo separa horizontal — el vertical entre
        // paneles apilados en la misma columna se maneja aquí.
        marginBottom: "0.85rem",
        // `inline-block` obliga al panel a comportarse como una
        // unidad indivisible dentro del flujo de columnas (algunos
        // engines tratan `block` con break-inside como parseable).
        display: "inline-block",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------
// Portada
// -----------------------------------------------------------------

function Cover() {
  return (
    <header
      style={{
        textAlign: "center",
        padding: "0.5rem 0",
        position: "relative",
      }}
    >
      {/* Nubecita de acentos en coral que rodean el título — mini
          burst/squiggles como los del PDF. */}
      <div style={{ position: "absolute", top: "0.5rem", left: "1rem" }}>
        <SparkleBurst color={CORAL} size={28} />
      </div>
      <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
        <Squiggle color={NAVY_BADGE} width={48} />
      </div>

      <h1
        style={{
          fontFamily: FREDOKA,
          fontWeight: 500,
          color: NAVY,
          fontSize: "clamp(1.55rem, 3.5vw, 2.1rem)",
          lineHeight: 1,
          margin: 0,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
        }}
      >
        Código
      </h1>
      <h1
        style={{
          fontFamily: FREDOKA,
          fontWeight: 700,
          color: CORAL,
          fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
          lineHeight: 1,
          margin: "0.2rem 0 0",
          fontStyle: "italic",
          letterSpacing: "-0.02em",
          transform: "rotate(-2deg)",
          display: "inline-block",
        }}
      >
        de la Manada
      </h1>
      <p
        style={{
          marginTop: "0.9rem",
          fontFamily: FREDOKA,
          fontWeight: 500,
          fontSize: "0.9rem",
          color: NAVY,
        }}
      >
        Tu perro está listo. Te toca leer y firmar.{" "}
        <Heart size={16} fill={CORAL} color={CORAL} style={{ display: "inline", marginLeft: "0.25rem", verticalAlign: "-2px" }} />
      </p>
    </header>
  );
}

// -----------------------------------------------------------------
// Preámbulo (declaración de propiedad + protesta de decir verdad)
// -----------------------------------------------------------------

function Preamble() {
  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-0.5rem",
          right: "-0.25rem",
        }}
      >
        <SparkleBurst color={NAVY_BADGE} size={24} />
      </div>
      <div
        style={{
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: "0.68rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: CORAL,
          marginBottom: "0.5rem",
        }}
      >
        Antes de empezar
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          lineHeight: 1.5,
          color: NAVY,
        }}
      >
        Al aceptar este código como parte de tu registro digital,
        declaras ser propietario, poseedor y/o responsable del o los
        perros que registres en Doggo Mundo, y manifiestas{" "}
        <strong>bajo protesta de decir verdad</strong> lo siguiente:
      </p>
    </div>
  );
}

// -----------------------------------------------------------------
// Regla (encabezado con píldora + título grande)
// -----------------------------------------------------------------

interface RuleProps {
  number: number;
  title: ReactNode;
  children: ReactNode;
}

function Rule({ number, title, children }: RuleProps) {
  return (
    <section>
      <div style={{ position: "relative", marginBottom: "0.85rem" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.22rem 0.75rem",
            background: CORAL,
            color: "#ffffff",
            borderRadius: "9999px",
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: "0.7rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transform: "rotate(-1.5deg)",
            boxShadow: "0 3px 10px rgba(229, 109, 95, 0.22)",
          }}
        >
          Regla {number}
        </span>

        <h2
          style={{
            marginTop: "0.4rem",
            marginBottom: 0,
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontStyle: "italic",
            fontSize: "clamp(1.15rem, 2vw, 1.4rem)",
            lineHeight: 1.05,
            color: NAVY,
            letterSpacing: "-0.01em",
            display: "inline-block",
            position: "relative",
          }}
        >
          {title}
          <Heart
            size={20}
            fill={CORAL}
            color={CORAL}
            style={{
              position: "absolute",
              top: "-0.4rem",
              right: "-1.75rem",
              transform: "rotate(15deg)",
            }}
          />
        </h2>

        <div style={{ marginTop: "0.5rem", marginLeft: "0.1rem" }}>
          <Underline color={CORAL} width={100} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {children}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------
// Point (tarjeta numerada con icono)
// -----------------------------------------------------------------

interface PointProps {
  n: number;
  label?: string;
  title: string;
  tone: "navy" | "coral";
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  children: ReactNode;
}

function Point({ n, label, title, tone, icon: Icon, children }: PointProps) {
  const bg = tone === "navy" ? NAVY_SOFT : CORAL_SOFT;
  const badge = tone === "navy" ? NAVY_BADGE : CORAL_BADGE;
  return (
    <div
      style={{
        display: "flex",
        gap: "0.6rem",
        padding: "0.65rem 0.7rem 0.65rem 0.6rem",
        background: bg,
        border: `1px solid ${BORDER}`,
        borderRadius: "0.75rem",
        position: "relative",
      }}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: "1.7rem",
          height: "1.7rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: badge,
          color: "#ffffff",
          borderRadius: "9999px",
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: "0.85rem",
          boxShadow: `0 2px 6px ${badge}40`,
        }}
      >
        {n}
      </div>

      <div style={{ minWidth: 0, flex: 1, paddingRight: "1.6rem" }}>
        {label && (
          <div
            style={{
              fontFamily: FREDOKA,
              fontSize: "0.6rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: MUTED_INK,
              marginBottom: "0.05rem",
              lineHeight: 1.1,
            }}
          >
            {label}
          </div>
        )}
        <div
          style={{
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: "0.9rem",
            color: NAVY,
            marginBottom: "0.2rem",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            lineHeight: 1.45,
            color: MUTED_INK,
          }}
        >
          {children}
        </div>
      </div>

      {/* Icono temático arriba-derecha del card, estilo hand-drawn
          simplificado — lucide-react con stroke fino y color
          matched al badge para no gritar. */}
      <Icon
        aria-hidden
        size={24}
        strokeWidth={1.5}
        color={badge}
        style={{
          position: "absolute",
          top: "0.55rem",
          right: "0.55rem",
          opacity: 0.28,
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------
// ProseCard (bloque prose sin badge — para Regla 3)
// -----------------------------------------------------------------

interface ProseCardProps {
  tone: "navy" | "coral";
  children: ReactNode;
}

function ProseCard({ tone, children }: ProseCardProps) {
  const bg = tone === "navy" ? NAVY_SOFT : CORAL_SOFT;
  return (
    <div
      style={{
        padding: "0.7rem 0.8rem",
        background: bg,
        border: `1px solid ${BORDER}`,
        borderRadius: "0.75rem",
        fontSize: "0.8rem",
        lineHeight: 1.5,
        color: NAVY,
      }}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------
// Footer con firma de marca + aviso de borrador
// -----------------------------------------------------------------

function Footer() {
  return (
    <footer
      style={{
        marginTop: "3rem",
        paddingTop: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        color: NAVY,
      }}
    >
      <Squiggle color={CORAL} width={80} />
      <div
        style={{
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>Doggo Mundo</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ fontStyle: "italic", fontWeight: 500 }}>
          donde los corazones ladran
        </span>
        <Heart size={16} fill={CORAL} color={CORAL} />
      </div>
    </footer>
  );
}

function PlaceholderNotice() {
  return (
    <div
      style={{
        marginTop: "2rem",
        borderRadius: "0.75rem",
        border: "1px solid #fcd34d",
        background: "#fffbeb",
        padding: "0.75rem 1rem",
        fontSize: "0.8rem",
        lineHeight: 1.5,
        color: "#78350f",
      }}
    >
      <strong>Aviso:</strong> esta es una transcripción del PDF
      operativo — sujeta a revisión y firma del despacho legal antes
      de considerarse la versión definitiva. Puedes cotejar el
      documento original en{" "}
      <a
        href="/legal/codigo-de-la-manada.png"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#78350f", textDecoration: "underline" }}
      >
        formato imagen
      </a>
      .
    </div>
  );
}

// -----------------------------------------------------------------
// Decoraciones SVG hand-drawn
// -----------------------------------------------------------------

/** Nubes onduladas azules que sirven de fondo tenue del canvas —
 *  posicionadas absolutas para no empujar el layout. */
function SkyDecorations() {
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 400 120"
        style={{
          position: "absolute",
          top: "-1rem",
          left: "-2rem",
          width: "22rem",
          height: "auto",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      >
        <path
          d="M0,60 Q40,10 80,40 T160,30 T240,50 T320,25 T400,45 L400,0 L0,0 Z"
          fill="#BFDCF6"
        />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 400 120"
        style={{
          position: "absolute",
          top: "35%",
          right: "-4rem",
          width: "20rem",
          height: "auto",
          opacity: 0.35,
          pointerEvents: "none",
          transform: "rotate(180deg)",
        }}
      >
        <path
          d="M0,60 Q40,20 80,45 T160,25 T240,55 T320,30 T400,50 L400,0 L0,0 Z"
          fill="#BFDCF6"
        />
      </svg>
    </>
  );
}

/** Burst de rayitos tipo hand-drawn, como los del PDF alrededor
 *  del título. */
function SparkleBurst({ color, size = 24 }: { color: string; size?: number }) {
  const s = size;
  const stroke = Math.max(2, size / 12);
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      width={s}
      height={s}
      style={{ transform: "rotate(-10deg)" }}
    >
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none">
        <line x1="20" y1="4" x2="20" y2="11" />
        <line x1="4" y1="20" x2="11" y2="20" />
        <line x1="29" y1="20" x2="36" y2="20" />
        <line x1="9" y1="9" x2="14" y2="14" />
        <line x1="26" y1="26" x2="31" y2="31" />
        <line x1="9" y1="31" x2="14" y2="26" />
      </g>
    </svg>
  );
}

/** Ondulación como underline / separador hand-drawn. */
function Squiggle({ color, width = 80 }: { color: string; width?: number }) {
  const height = Math.max(10, width * 0.15);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      <path
        d={`M2 ${height / 2} Q ${width * 0.15} 2 ${width * 0.3} ${height / 2} T ${width * 0.6} ${height / 2} T ${width * 0.9} ${height / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Underline curvo tipo brush stroke bajo el título de cada regla. */
function Underline({ color, width = 100 }: { color: string; width?: number }) {
  const height = 12;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      <path
        d={`M2 ${height - 2} Q ${width / 2} ${-height / 2} ${width - 2} ${height - 2}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
