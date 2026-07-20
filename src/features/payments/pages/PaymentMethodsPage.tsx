import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  Plus,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { stripeEnabled } from "@/features/payments/stripe-enabled";
import { AddCardForm } from "@/features/payments/components/AddCardForm";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  type PaymentMethod,
} from "@/api/hooks/use-payments";

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
  unknown: "Tarjeta",
};

function brandLabel(brand: string): string {
  return BRAND_LABEL[brand] ?? brand;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function PaymentMethodsPage() {
  const enabled = stripeEnabled();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<PaymentMethod | null>(null);
  const list = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const remove = useDeletePaymentMethod();

  if (!enabled) {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Módulo de pagos no configurado
            </CardTitle>
            <CardDescription>
              Stripe no está configurado en este entorno. Si esto es
              producción, revisa la variable de entorno
              VITE_STRIPE_PUBLISHABLE_KEY.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageShell>
    );
  }

  if (list.isLoading) {
    return (
      <PageShell>
        <LoadingState rows={2} />
      </PageShell>
    );
  }

  const cards = list.data ?? [];

  async function handleSetDefault(pm: PaymentMethod) {
    if (pm.is_default) return;
    try {
      await setDefault.mutateAsync(pm.id);
      toast.success("Tarjeta default actualizada");
    } catch {
      toast.error("No se pudo actualizar el default");
    }
  }

  async function confirmRemove() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success("Tarjeta eliminada");
      setToDelete(null);
    } catch {
      toast.error("No se pudo eliminar la tarjeta");
    }
  }

  return (
    <PageShell>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Tarjetas guardadas</CardTitle>
            <CardDescription>
              {cards.length === 0
                ? "Aún no tienes tarjetas guardadas."
                : "La tarjeta marcada como default se usa para cobros futuros automáticos."}
            </CardDescription>
          </div>
          {!adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {cards.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {brandLabel(pm.brand)} •••• {pm.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence {pad(pm.exp_month)}/{String(pm.exp_year).slice(-2)}
                    {pm.is_default && (
                      <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Default
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!pm.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetDefault(pm)}
                    disabled={setDefault.isPending}
                    aria-label="Marcar como default"
                    title="Marcar como default"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setToDelete(pm)}
                  disabled={remove.isPending}
                  aria-label="Eliminar tarjeta"
                  title="Eliminar tarjeta"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {adding && (
            <div className="rounded-lg border p-3">
              <p className="mb-3 text-sm font-medium">Agregar nueva tarjeta</p>
              <AddCardForm
                onAdded={() => setAdding(false)}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}

          {cards.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground">
              Agrega una tarjeta para que tus reservas futuras sean
              instantáneas — solo se cobra al completar el servicio.
            </p>
          )}
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Eliminar tarjeta"
        description={
          toDelete
            ? toDelete.is_default
              ? `Vas a eliminar tu tarjeta default ${brandLabel(toDelete.brand)} •••• ${toDelete.last4}. Tus cobros futuros automáticos quedarán pausados hasta que marques otra tarjeta como default.`
              : `Vas a eliminar tu tarjeta ${brandLabel(toDelete.brand)} •••• ${toDelete.last4}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmRemove}
        isLoading={remove.isPending}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Métodos de pago</h1>
        <p className="text-sm text-muted-foreground">
          Administra las tarjetas que usas en Doggo Mundo. En citas y
          membresías, la tarjeta marcada como default se usa para
          cargos automáticos; en la tienda puedes elegir cualquiera al
          momento del pago.
        </p>
      </header>
      {children}
    </div>
  );
}
