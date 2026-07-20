import { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useReactivateSubscription } from "@/api/hooks/use-memberships";
import { formatDate } from "@/lib/format-date";

interface Props {
  subscriptionId: string;
  cancelsAt: string; // ISO
}

/**
 * F6-A "pending cancel" banner. Shown at the top of the subscription
 * detail page whenever `cancels_at` is set — the sub is still ACTIVE
 * but Stripe has it scheduled to cancel on the given date. Gives the
 * customer a one-click "Reactivar" out that reverses the cancellation
 * via the backend (which calls stripe.Subscription.modify).
 */
export function PendingCancelBanner({ subscriptionId, cancelsAt }: Props) {
  const [busy, setBusy] = useState(false);
  const reactivate = useReactivateSubscription(subscriptionId);

  async function handleReactivate() {
    setBusy(true);
    try {
      await reactivate.mutateAsync();
      toast.success("Tu membresía sigue activa.");
    } catch {
      toast.error(
        "No pudimos reactivar. Recarga la página o intenta de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border border-amber-400/60 bg-amber-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="space-y-0.5">
          <p className="font-medium text-amber-900">
            Cancelación programada
          </p>
          <p className="text-xs text-amber-800">
            Tu membresía se cancela el{" "}
            <strong>{formatDate(cancelsAt)}</strong>. Sigues teniendo
            beneficios hasta esa fecha.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReactivate}
        disabled={busy}
        className="shrink-0 border-amber-500 text-amber-900 hover:bg-amber-100"
      >
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        {busy ? "Reactivando…" : "Reactivar"}
      </Button>
    </div>
  );
}
