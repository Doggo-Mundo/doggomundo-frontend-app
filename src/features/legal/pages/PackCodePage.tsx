import "@fontsource-variable/fredoka";
import { Fragment, useEffect, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { saveStoredSignature } from "@/features/legal/pack-code-signature";
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
  const cover = (
    <Panel accent="cover">
      <Cover />
    </Panel>
  );
  const preamble = (
    <Panel>
      <Preamble />
    </Panel>
  );
  const signForm = (
    <Panel>
      <SignForm />
    </Panel>
  );

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
        {/* Layout:
            - Mobile (1 col): todo apilado en orden de lectura,
              SignForm al final.
            - Desktop: col 0 lleva Cover + Preámbulo + SignForm
              (para que el usuario firme sin scrollear todo el
              documento — aprovecha el aire libre de esa columna).
              Las 4 Reglas se reparten en las columnas restantes. */}
        <PackCodeLayout leading={[cover, preamble, signForm]}>
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
        </PackCodeLayout>

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
      }}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------
// PackCodeLayout — orquesta la posición de la SignForm por viewport
// -----------------------------------------------------------------

interface PackCodeLayoutProps {
  /** Bloques que van en la columna izquierda en desktop (Cover,
   *  Preámbulo, SignForm). En mobile se mezclan con `children`
   *  reservando el último (SignForm) para el final absoluto. */
  leading: ReactNode[];
  /** Las 4 Reglas — se distribuyen entre las columnas restantes
   *  en desktop, o se apilan en medio en mobile. */
  children: ReactNode;
}

/** Layout responsive del código de la manada.
 *  - 1 columna (mobile): [Cover, Preámbulo, Regla 1..4, SignForm].
 *    SignForm al final para no romper la lectura.
 *  - N > 1 columnas (desktop): col 0 = [Cover, Preámbulo, SignForm]
 *    para que el usuario firme sin scrollear todo el documento y
 *    aprovechar el aire libre de esa columna corta. Las Reglas se
 *    reparten entre las N-1 columnas restantes preservando su
 *    orden de lectura. */
function PackCodeLayout({ leading, children }: PackCodeLayoutProps) {
  const cols = useColumnCount();
  const rules = Array.isArray(children) ? children : [children];
  // Pesos aproximados de las 4 Reglas por altura (5/4/3 puntos +
  // Deslinde largo). Los usa distributeInOrder para decidir cuándo
  // saltar de columna.
  const ruleWeights = [6, 5, 4, 6];

  if (cols === 1) {
    // Mobile: leading[0..-2] arriba, Reglas en medio, SignForm al
    // final (leading[leading.length - 1]).
    const head = leading.slice(0, -1);
    const tail = leading[leading.length - 1];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        {head.map((node, i) => (
          <Fragment key={`h${i}`}>{node}</Fragment>
        ))}
        {rules.map((node, i) => (
          <Fragment key={`r${i}`}>{node}</Fragment>
        ))}
        <Fragment key="tail">{tail}</Fragment>
      </div>
    );
  }

  // Desktop: primera columna = leading, resto = Reglas repartidas.
  const ruleColumns = distributeInOrder(rules, cols - 1, ruleWeights);
  const allColumns = [leading, ...ruleColumns];

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
      {allColumns.map((col, i) => (
        <div
          key={i}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          {col.map((node, j) => (
            <Fragment key={j}>{node}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Determina el número de columnas según el ancho del viewport.
 *  Breakpoints elegidos para que cada columna tenga entre 260-360px
 *  de ancho — suficiente para dos-tres líneas de texto por bullet
 *  sin sacrificar densidad. En SSR arranca en 1 y sube al hidratar. */
function useColumnCount() {
  const compute = () => {
    if (typeof window === "undefined") return 1;
    const w = window.innerWidth;
    if (w >= 1600) return 5;
    if (w >= 1280) return 4;
    if (w >= 960) return 3;
    if (w >= 640) return 2;
    return 1;
  };
  const [cols, setCols] = useState<number>(compute);
  useEffect(() => {
    const handler = () => setCols(compute());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cols;
}

/** Distribuye items en `cols` columnas manteniendo el orden. Corta
 *  hacia la siguiente columna cuando el peso acumulado supera
 *  `total / cols`, evitando que la última columna se quede vacía. */
function distributeInOrder(
  items: ReactNode[],
  cols: number,
  weights: number[],
): ReactNode[][] {
  if (cols <= 1) return [items];
  const total = weights.reduce((s, w) => s + w, 0);
  const target = total / cols;
  const columns: ReactNode[][] = [[]];
  let currentWeight = 0;
  items.forEach((item, idx) => {
    const w = weights[idx] ?? 1;
    const isLastColumn = columns.length === cols;
    const wouldOverflow = currentWeight > 0 && currentWeight + w > target;
    if (!isLastColumn && wouldOverflow) {
      columns.push([item]);
      currentWeight = w;
    } else {
      columns[columns.length - 1].push(item);
      currentWeight += w;
    }
  });
  // Rellenar con columnas vacías si por alguna razón quedaron menos
  // que cols (ej. muchos items pesados juntos al principio).
  while (columns.length < cols) columns.push([]);
  return columns;
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
// SignForm — el usuario deja sus datos y "firma" el código
// -----------------------------------------------------------------

const PACK_CODE_SIGNED_MESSAGE = "pack-code-signed";

interface SignaturePayload {
  type: typeof PACK_CODE_SIGNED_MESSAGE;
  signature: {
    full_name: string;
    phone: string;
    pet_names: string;
    signed_at: string;
  };
}

/** Formatea `new Date()` como "29 de septiembre de 2026" en es-MX
 *  para el campo Fecha (readonly). Usa Intl.DateTimeFormat porque
 *  la locale del navegador puede no ser es-MX y queremos formato
 *  consistente en el documento. */
function todayLabel() {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function SignForm() {
  // Prefill via query params — RegisterPage / SetupPage pueden pasar
  // `?name=X&phone_country_code=Y&phone=Z` cuando abren el pack code
  // en target _blank para no re-pedir datos que el usuario ya
  // escribió. Si vienen prellenados, el dato ya se capturó (y
  // validó) en el form de registro — aquí solo se muestra, no se
  // vuelve a pedir editable (ver `nameIsPrefilled`/`phoneIsPrefilled`).
  const initial = (() => {
    if (typeof window === "undefined") {
      return { name: "", phoneCountryCode: "", phoneNumber: "" };
    }
    const p = new URLSearchParams(window.location.search);
    return {
      name: p.get("name") ?? "",
      phoneCountryCode: p.get("phone_country_code") ?? "",
      phoneNumber: p.get("phone") ?? "",
    };
  })();
  const nameIsPrefilled = Boolean(initial.name);
  const phoneIsPrefilled = Boolean(initial.phoneCountryCode && initial.phoneNumber);

  const [fullName, setFullName] = useState(initial.name);
  const [phone, setPhone] = useState(
    phoneIsPrefilled ? `${initial.phoneCountryCode}${initial.phoneNumber}` : "",
  );
  const [petNames, setPetNames] = useState("");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [orphanSigned, setOrphanSigned] = useState(false);

  const dateText = todayLabel();

  // El input nativo no bloquea letras/símbolos solo por tener
  // inputMode="tel" — filtramos en vivo. Se preserva un "+" inicial
  // (entrada directa sin prefill no tiene selector de país aparte).
  function handlePhoneChange(value: string) {
    const hasLeadingPlus = value.startsWith("+");
    const digits = value.replace(/\D/g, "");
    setPhone(hasLeadingPlus ? `+${digits}` : digits);
  }

  function validate() {
    const next: { [k: string]: string } = {};
    if (!fullName.trim()) next.fullName = "Escribe tu nombre completo.";
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, "")))
      next.phone = "Teléfono inválido (10 a 15 dígitos).";
    if (!petNames.trim())
      next.petNames = "Escribe el nombre de tu(s) perro(s).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    const signature = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      pet_names: petNames.trim(),
      signed_at: new Date().toISOString(),
    };
    const payload: SignaturePayload = {
      type: PACK_CODE_SIGNED_MESSAGE,
      signature,
    };

    // Persistir SIEMPRE en localStorage — así el register lo
    // detecta aunque no exista `window.opener` (visita directa) o
    // la pestaña padre se haya cerrado. También sirve para
    // sobrevivir a un reload de la pestaña de registro.
    saveStoredSignature(signature);

    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      // Firmado desde el flujo de registro: avisamos al tab padre
      // (marca el checkbox de aceptación) y cerramos. Delay chico
      // para asegurar que postMessage salga antes del close.
      try {
        opener.postMessage(payload, window.location.origin);
      } catch {
        // origen distinto — mejor no cerrar y mostrar estado ok.
        setOrphanSigned(true);
        return;
      }
      setTimeout(() => window.close(), 250);
    } else {
      // Visita directa (link compartido, bookmark). No hay a quién
      // avisarle vía postMessage — pero localStorage + storage
      // event ya avisó a los otros tabs si el register está abierto.
      setOrphanSigned(true);
    }
  }

  if (orphanSigned) {
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <div
          style={{
            fontFamily: FREDOKA,
            fontWeight: 600,
            color: CORAL,
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          Firmado
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", color: NAVY }}>
          Ya registramos tu firma del Código de la Manada. Puedes
          cerrar esta pestaña.
        </p>
        <Heart
          size={22}
          fill={CORAL}
          color={CORAL}
          style={{ marginTop: "0.75rem" }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div
        style={{
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: "0.68rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: CORAL,
          marginBottom: "0.4rem",
        }}
      >
        Firma
      </div>
      <div
        style={{
          fontFamily: FREDOKA,
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: "1.2rem",
          color: NAVY,
          marginBottom: "0.75rem",
          lineHeight: 1.1,
        }}
      >
        Estoy de acuerdo con la Manada
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        <SignField label="Fecha" readOnly value={dateText} />
        <SignField
          label="Nombre completo"
          value={fullName}
          onChange={setFullName}
          readOnly={nameIsPrefilled}
          error={submitted ? errors.fullName : undefined}
          placeholder="Tu nombre y apellido"
          autoComplete="name"
        />
        <SignField
          label="Nombre de tu(s) perro(s)"
          value={petNames}
          onChange={setPetNames}
          error={submitted ? errors.petNames : undefined}
          placeholder="Ej. Luna, Otto"
        />
        <SignField
          label="Teléfono"
          value={
            phoneIsPrefilled
              ? `${initial.phoneCountryCode} ${initial.phoneNumber}`
              : phone
          }
          onChange={handlePhoneChange}
          readOnly={phoneIsPrefilled}
          error={submitted ? errors.phone : undefined}
          placeholder="+52 5512345678"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      <button
        type="submit"
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.7rem 1rem",
          background: CORAL,
          color: "#ffffff",
          border: 0,
          borderRadius: "9999px",
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(229, 109, 95, 0.35)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
        }}
      >
        Firmar el Código
        <Heart size={14} fill="#ffffff" color="#ffffff" />
      </button>

      <p
        style={{
          marginTop: "0.6rem",
          marginBottom: 0,
          fontSize: "0.7rem",
          lineHeight: 1.4,
          color: MUTED_INK,
          textAlign: "center",
        }}
      >
        Al firmar aceptas las cuatro reglas anteriores y quedará
        registrado en tu cuenta con fecha y hora.
      </p>
    </form>
  );
}

interface SignFieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  error?: string;
  placeholder?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}

function SignField({
  label,
  value,
  onChange,
  readOnly = false,
  error,
  placeholder,
  inputMode = "text",
  autoComplete,
}: SignFieldProps) {
  const invalid = Boolean(error);
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontFamily: FREDOKA,
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: MUTED_INK,
          marginBottom: "0.2rem",
        }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        style={{
          width: "100%",
          padding: "0.55rem 0.7rem",
          background: readOnly ? "transparent" : PAPER,
          border: `1px solid ${invalid ? CORAL : "rgba(34, 45, 86, 0.15)"}`,
          borderRadius: "0.6rem",
          fontSize: "0.9rem",
          fontFamily: BODY_FONT,
          color: NAVY,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <div
          style={{
            marginTop: "0.2rem",
            fontSize: "0.7rem",
            color: CORAL,
          }}
        >
          {error}
        </div>
      )}
    </label>
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
