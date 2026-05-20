import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Crown, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BackLink } from "@/features/pets/components/BackLink";
import { SubscriptionStatusBadge } from "@/features/memberships/components/SubscriptionStatusBadge";
import { BalanceRow } from "@/features/memberships/components/BalanceRow";
import {
  useCancelSubscription,
  useSubscription,
  useSubscriptionCycles,
} from "@/api/hooks/use-memberships";
import { formatDate } from "@/lib/format-date";
import { CYCLE_STATUS_LABEL } from "@/types/membership";

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    data: subscription,
    isLoading,
    isError,
  } = useSubscription(id ?? "");
  const { data: cycles } = useSubscriptionCycles(id ?? "");
  const cancel = useCancelSubscription(id ?? "");

  if (!id) return <Navigate to="/my/subscriptions" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/subscriptions" label="Mis suscripciones" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/subscriptions" label="Mis suscripciones" />
        <EmptyState title="No pudimos cargar esta suscripción" />
      </div>
    );
  }

  const canCancel =
    subscription.status === "active" || subscription.status === "paused";
  // Backend returns only active cycles in active_balances; show history below.
  const pastCycles = (cycles ?? []).filter((c) => c.status === "closed");

  async function handleCancel() {
    try {
      await cancel.mutateAsync();
      toast.success("Tu suscripción fue cancelada.");
      setConfirmOpen(false);
      navigate("/my/subscriptions", { replace: true });
    } catch {
      toast.error("No pudimos cancelar la suscripción. Intenta de nuevo.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to="/my/subscriptions" label="Mis suscripciones" />

      <header className="space-y-2">
        <SubscriptionStatusBadge status={subscription.status} />
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Crown className="h-6 w-6 text-muted-foreground" />
          {subscription.plan_name}
        </h1>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Periodo actual:{" "}
          {formatDate(subscription.current_period_start)} –{" "}
          {formatDate(subscription.current_period_end)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tus beneficios de este periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {subscription.active_balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay beneficios activos en este periodo.
            </p>
          ) : (
            subscription.active_balances.map((b) => (
              <BalanceRow key={b.id} balance={b} />
            ))
          )}
        </CardContent>
      </Card>

      {pastCycles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Historial de ciclos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {pastCycles.map((c) => (
              <div key={c.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">
                  {formatDate(c.period_start)} – {formatDate(c.period_end)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {CYCLE_STATUS_LABEL[c.status]}
                </p>
                {c.balances.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {c.balances.map((b) => (
                      <li
                        key={b.id}
                        className="flex justify-between text-xs text-muted-foreground"
                      >
                        <span>{b.service_name}</span>
                        <span>
                          {b.used_qty} / {b.included_qty} usados
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
        >
          <X />
          Cancelar suscripción
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancelar suscripción"
        description="Dejarás de recibir los beneficios al terminar el periodo actual. Esta acción no se puede deshacer."
        confirmLabel="Cancelar suscripción"
        cancelLabel="Volver"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancel.isPending}
      />
    </div>
  );
}
