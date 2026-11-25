import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawMark, StarMark } from "@/components/brand/BrandIcon";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Formularios largos (registro): desde `lg` la tarjeta se ensancha
   *  y el logo pasa a la izquierda, para que todo quepa sin scroll en
   *  pantallas grandes. En móvil se ve igual que el resto. */
  wide?: boolean;
}

// V2: mismo lenguaje que la landing — fondo navy con huellas y
// estrellas, logo oficial arriba, tarjeta blanca con contorno y sombra
// dura. Aquí el acento es el azul Doggo, no el amarillo: sobre navy el
// amarillo resaltaba demasiado. Es la primera pantalla que ve quien
// llega desde los CTAs de la landing.
export function AuthLayout({ title, description, footer, children, wide = false }: Props) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-primary px-4 py-8",
        wide && "lg:flex-row lg:gap-12",
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
      }}
    >
      <PawMark className="dm-spin-rev pointer-events-none absolute -bottom-24 -left-28 h-[340px] w-[340px] text-navy-soft opacity-70" />
      <PawMark className="dm-float pointer-events-none absolute top-16 right-[8%] hidden h-20 w-20 text-navy-soft sm:block" />
      <StarMark className="dm-twinkle pointer-events-none absolute top-[12%] left-[10%] h-6 w-6 text-white" />
      <StarMark className="dm-twinkle2 pointer-events-none absolute right-[14%] bottom-[18%] h-5 w-5 text-brand-blue-4" />

      <Link
        to="/login"
        className="relative rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <img
          src="/doggo-logo.png"
          alt="Doggo Mundo"
          className={cn("h-28 w-auto sm:h-32", wide && "lg:h-44")}
        />
      </Link>

      <Card
        className={cn(
          "relative w-full max-w-sm border-[3px] shadow-[8px_8px_0_var(--accent)]",
          wide && "lg:max-w-[46rem]",
        )}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn("space-y-4", wide && "lg:px-6")}>
          {children}
          {footer && (
            <div className="pt-2 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
