import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawMark, StarMark } from "@/components/brand/BrandIcon";

interface Props {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// V2: mismo lenguaje que la landing — fondo navy con huellas y
// estrellas, logo oficial arriba, tarjeta blanca con contorno y
// sombra dura amarilla. Es la primera pantalla que ve quien llega
// desde los CTAs de la landing.
export function AuthLayout({ title, description, footer, children }: Props) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-primary px-4 py-8"
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
        <img src="/doggo-logo.png" alt="Doggo Mundo" className="h-20 w-auto" />
      </Link>

      <Card className="relative w-full max-w-sm border-[3px] shadow-[8px_8px_0_var(--sun)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
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
