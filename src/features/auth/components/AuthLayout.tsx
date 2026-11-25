import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawMark, StarMark } from "@/components/brand/BrandIcon";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Formularios largos (registro): la tarjeta se ensancha en
   *  pantallas grandes para repartir el formulario en columnas y que
   *  quepa sin scroll. El logo sigue arriba. En móvil se ve igual que
   *  el resto. */
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
        "relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-primary px-4",
        "pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]",
        // Pantallas grandes: menos aire vertical fuera de la tarjeta
        // para que el registro quepa completo.
        wide && "lg:gap-3 lg:pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
      )}
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
          className={cn("h-28 w-auto sm:h-32", wide && "lg:h-28")}
        />
      </Link>

      <Card
        className={cn(
          "relative w-full max-w-sm border-[3px] shadow-[8px_8px_0_var(--accent)]",
          wide && "lg:max-w-[56rem]",
        )}
      >
        <CardHeader className={cn("text-center", wide && "lg:px-8")}>
          <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn("space-y-4", wide && "lg:space-y-5 lg:px-8 lg:pb-2")}>
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
