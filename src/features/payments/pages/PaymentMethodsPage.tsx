import { CreditCard, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { stripeEnabled } from "@/features/payments/StripeProvider";

/**
 * Stub page for Fase 0. Establishes the URL (/payment-methods) and the
 * navigation hook so we can link to it from the profile + booking
 * wizard now, even though the actual "agregar tarjeta" / "tarjetas
 * guardadas" UX ships in Fase 1 with the SetupIntent flow.
 *
 * Renders three states:
 *   - Stripe not configured for this env → "no disponible" hint
 *   - Stripe configured but no SetupIntent endpoint yet → "próximamente"
 *   - (Fase 1) live list of PaymentMethods + add card form
 */
export function PaymentMethodsPage() {
  const enabled = stripeEnabled();

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Métodos de pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Guarda tus tarjetas para reservar más rápido y para que el
          cobro al terminar el servicio sea automático.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">Tarjetas guardadas</CardTitle>
            <CardDescription>
              {enabled
                ? "Próximamente vas a poder agregar y administrar tus tarjetas desde aquí."
                : "El módulo de pagos aún no está configurado en este entorno."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline" className="w-full sm:w-auto">
            Agregar tarjeta
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">Tus datos están seguros</CardTitle>
            <CardDescription>
              Los datos de tu tarjeta los maneja Stripe directamente,
              nunca tocan los servidores de Doggo Mundo. Cumplimos con
              PCI-DSS y la Ley Federal de Protección de Datos
              Personales en México.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" asChild>
          <Link to="/profile">Volver al perfil</Link>
        </Button>
      </div>
    </div>
  );
}
