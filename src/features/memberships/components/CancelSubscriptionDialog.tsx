import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelSubscription,
  type CancellationReason,
} from "@/api/hooks/use-memberships";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriptionId: string;
  currentPeriodEnd: string; // date string
  onSuccess: (cancelsAt: string) => void;
}

const REASONS: { key: CancellationReason; label: string }[] = [
  { key: "too_expensive", label: "Muy caro" },
  { key: "not_using", label: "No lo estoy usando" },
  { key: "quality", label: "Calidad del servicio" },
  { key: "other", label: "Otro" },
];

/**
 * F6-A cancel dialog. Two-step conceptually within one modal:
 * 1. Reason selector (radio-style) + optional feedback textarea.
 * 2. Confirm click → POST to backend (schedules with Stripe).
 *
 * Copy makes it explicit that beneficios siguen hasta el fin del
 * período actual (Stripe's cancel_at_period_end model) so the
 * customer doesn't panic-cancel thinking they lose access today.
 */
export function CancelSubscriptionDialog({
  open, onOpenChange, subscriptionId, currentPeriodEnd, onSuccess,
}: Props) {
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancel = useCancelSubscription(subscriptionId);

  async function handleConfirm() {
    if (!reason) {
      setError("Elige un motivo para continuar.");
      return;
    }
    setError(null);
    try {
      const resp = await cancel.mutateAsync({
        reason,
        feedback: feedback.trim() || undefined,
      });
      onSuccess(resp.cancels_at);
      onOpenChange(false);
      // Reset for the next open
      setReason(null);
      setFeedback("");
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { data?: { detail?: string; reason?: string } };
      };
      setError(
        anyErr.response?.data?.detail
          ?? anyErr.response?.data?.reason
          ?? "No pudimos programar la cancelación. Intenta de nuevo.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar tu membresía</DialogTitle>
          <DialogDescription>
            Tu membresía seguirá activa hasta el{" "}
            <strong>{formatDate(currentPeriodEnd)}</strong>. Después de
            esa fecha no se te cobrará y perderás acceso a los
            beneficios. Puedes cambiar de opinión antes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label className="text-sm">¿Por qué te vas?</Label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setReason(r.key)}
                aria-pressed={reason === r.key}
                className={cn(
                  "rounded-md border p-2 text-left text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  reason === r.key
                    ? "border-primary bg-secondary"
                    : "border-border hover:bg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancel-feedback" className="text-sm">
            ¿Quieres contarnos más? (opcional)
          </Label>
          <Textarea
            id="cancel-feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={2000}
            placeholder="Un detalle nos ayuda a mejorar."
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancel.isPending || !reason}
          >
            {cancel.isPending
              ? "Programando…"
              : "Sí, cancelar al fin del período"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancel.isPending}
          >
            Mejor no
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
