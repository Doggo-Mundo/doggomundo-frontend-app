import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Clock,
  PawPrint,
  Sparkles,
  Store,
  X,
} from "lucide-react";
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
import { AppointmentStatusBadge } from "@/features/appointments/components/AppointmentStatusBadge";
import { isTerminal } from "@/features/appointments/lib/filter";
import {
  useAppointment,
  useCancelMyAppointment,
} from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import {
  CANCELLATION_WINDOW_HOURS,
  formatLongDate,
  formatTime,
  isWithinCancellationWindow,
} from "@/lib/format-date";
import type { AppointmentItem } from "@/types/appointment";

function formatItemPrice(price: string | null): string | null {
  if (!price) return null;
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("es-MX")}` : null;
}

function primaryItem(items: AppointmentItem[]): AppointmentItem | null {
  return items[0] ?? null;
}

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: appointment, isLoading, isError } = useAppointment(id ?? "");
  const cancel = useCancelMyAppointment(id ?? "");
  const { data: petsData } = usePets();

  const petName = useMemo(() => {
    if (!appointment?.pet) return null;
    return petsData?.results.find((p) => p.id === appointment.pet)?.name ?? null;
  }, [appointment, petsData]);

  if (!id) return <Navigate to="/my/appointments" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/appointments" label="Mis citas" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/appointments" label="Mis citas" />
        <EmptyState title="No pudimos cargar esta cita" />
      </div>
    );
  }

  const withinWindow = isWithinCancellationWindow(appointment.scheduled_start);
  const terminal = isTerminal(appointment.status);
  // Customers can now cancel even inside the window — but the action goes
  // through a separate confirm path that requires acknowledging the penalty.
  const canCancel = !terminal && appointment.status === "scheduled";
  const headline =
    primaryItem(appointment.items)?.service_name ??
    appointment.business_unit_name;

  // Total price = sum of item price_snapshots. Used to surface the penalty
  // cost in the warning dialog so the user knows what they'd be agreeing
  // to. Inline (not useMemo) because hooks below the early-return guards
  // above would violate Rules of Hooks, and the array is short anyway.
  const totalPrice = appointment.items.reduce((acc, it) => {
    const n = Number(it.price_snapshot ?? 0);
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
  const totalPriceLabel = totalPrice > 0
    ? `$${totalPrice.toLocaleString("es-MX")}`
    : null;

  async function handleCancel() {
    try {
      await cancel.mutateAsync({ acknowledgePenalty: withinWindow });
      toast.success(
        withinWindow
          ? "Tu cita fue cancelada. Se aplicará el cargo por cancelación tardía."
          : "Tu cita fue cancelada.",
      );
      setConfirmOpen(false);
      navigate("/my/appointments", { replace: true });
    } catch {
      toast.error("No pudimos cancelar la cita. Intenta de nuevo.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to="/my/appointments" label="Mis citas" />

      <header className="space-y-2">
        <AppointmentStatusBadge status={appointment.status} />
        <h1 className="text-2xl font-semibold">{headline}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {formatLongDate(appointment.scheduled_start)} ·{" "}
          {formatTime(appointment.scheduled_start)} –{" "}
          {formatTime(appointment.scheduled_end)}
        </p>
      </header>

      {/* F-F.3: warning soft cuando el pet no tiene cartilla al
          día. NO bloquea la reserva — es nudge friendly para que
          el cliente suba la cartilla antes del servicio. El backend
          controla el flag via `vaccination_warning`. */}
      {appointment.vaccination_warning && appointment.pet && (
        <VaccinationWarningCard petId={appointment.pet} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {appointment.items.map((item) => {
            const priceLabel = formatItemPrice(item.price_snapshot);
            return (
              <div key={item.id} className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.service_name}</p>
                  {(item.duration_minutes_snapshot || priceLabel) && (
                    <p className="text-xs text-muted-foreground">
                      {item.duration_minutes_snapshot && (
                        <>{item.duration_minutes_snapshot} min</>
                      )}
                      {item.duration_minutes_snapshot && priceLabel && " · "}
                      {priceLabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize">
                {formatLongDate(appointment.scheduled_start)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(appointment.scheduled_start)} –{" "}
                {formatTime(appointment.scheduled_end)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="font-medium">{appointment.business_unit_name}</p>
          </div>

          {petName && (
            <div className="flex items-start gap-3">
              <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="font-medium">{petName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {appointment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-line">
            {appointment.notes}
          </CardContent>
        </Card>
      )}

      {!terminal && (
        <div className="space-y-2">
          {withinWindow && (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              Faltan menos de {CANCELLATION_WINDOW_HOURS} horas para tu cita.
              Cancelar ahora genera un cargo
              {totalPriceLabel ? ` de ${totalPriceLabel}` : ""} por cancelación
              tardía.
            </p>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={!canCancel}
          >
            <X />
            Cancelar cita
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={withinWindow ? "Cancelación tardía con cargo" : "Cancelar cita"}
        description={
          withinWindow
            ? `Faltan menos de ${CANCELLATION_WINDOW_HOURS}h para tu cita. ` +
              (totalPriceLabel
                ? `Si cancelas ahora se aplicará un cargo de ${totalPriceLabel} por cancelación tardía. `
                : "Si cancelas ahora se aplicará un cargo por cancelación tardía. ") +
              "Esta acción no se puede deshacer."
            : "Esta acción no se puede deshacer."
        }
        confirmLabel={
          withinWindow ? "Acepto el cargo y cancelo" : "Cancelar cita"
        }
        cancelLabel="Volver"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancel.isPending}
      />
    </div>
  );
}


/** F-F.3: banner amable recordando subir cartilla al día. Es link
 *  directo a la sección de documentos del pet — el cliente entra,
 *  sube la foto, y el warning desaparece en el próximo refresh
 *  cuando el pet tenga al menos una VaccinationRecord vigente. */
function VaccinationWarningCard({ petId }: { petId: string }) {
  return (
    <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-900/10">
      <CardContent className="flex items-start gap-3 py-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Sube tu cartilla de vacunación al día
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
            Si al momento de tu cita no tienes la cartilla
            registrada y con vacunas vigentes, no podremos
            completar el servicio (protegemos a todos los peludos).
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-amber-400 bg-white text-amber-900 hover:bg-amber-50"
          >
            <a href={`/pets/${petId}/documents`}>
              Subir cartilla
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
