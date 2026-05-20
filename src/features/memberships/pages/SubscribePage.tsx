import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import {
  useMembershipPlans,
  useSubscribe,
} from "@/api/hooks/use-memberships";
import { formatMoney } from "@/features/orders/lib/format-money";
import { BILLING_INTERVAL_LABEL } from "@/types/membership";

function extractApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) return "No pudimos suscribirte. Intenta de nuevo.";
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, string[] | string | undefined>;
    for (const key of ["detail", "non_field_errors", "plan", "error"]) {
      const val = record[key];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
    const firstKey = Object.keys(record)[0];
    if (firstKey) {
      const val = record[firstKey];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return "No pudimos suscribirte. Intenta de nuevo.";
}

export function SubscribePage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: plans, isLoading, isError } = useMembershipPlans();
  const subscribe = useSubscribe();
  const [error, setError] = useState<string | null>(null);

  const plan = plans?.find((p) => p.id === planId);

  if (!planId) return <Navigate to="/memberships" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/memberships" label="Membresías" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="space-y-4">
        <BackLink to="/memberships" label="Membresías" />
        <EmptyState
          title="No encontramos este plan"
          description="Puede que ya no esté disponible."
        />
      </div>
    );
  }

  async function handleConfirm() {
    if (!plan) return;
    setError(null);
    try {
      const subscription = await subscribe.mutateAsync({ plan: plan.id });
      toast.success(`¡Bienvenido a ${plan.name}!`);
      navigate(`/my/subscriptions/${subscription.id}`, { replace: true });
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to="/memberships" label="Membresías" />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{plan.name}</h1>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precio</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">
              {formatMoney(plan.price_monthly)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {BILLING_INTERVAL_LABEL[plan.billing_interval].toLowerCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      {plan.entitlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Qué incluye?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-sm">
              {plan.entitlements.map((e) => (
                <li key={e.service} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                  <span>
                    <strong>{e.quantity_per_cycle}×</strong> {e.service_name}{" "}
                    <span className="text-muted-foreground">
                      por{" "}
                      {plan.billing_interval === "monthly"
                        ? "mes"
                        : "trimestre"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {plan.terms && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Términos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-line text-muted-foreground">
            {plan.terms}
          </CardContent>
        </Card>
      )}

      <FormErrors message={error ?? undefined} />

      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={subscribe.isPending}
      >
        {subscribe.isPending ? "Activando…" : "Confirmar suscripción"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Puedes cancelar cuando quieras desde tu perfil.
      </p>
    </div>
  );
}
