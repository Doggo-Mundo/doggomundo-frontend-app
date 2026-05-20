import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
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
  formatLongDate,
  formatTime,
  isWithin24h,
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

  const within24h = isWithin24h(appointment.scheduled_start);
  const terminal = isTerminal(appointment.status);
  const canCancel =
    !terminal && !within24h && appointment.status === "scheduled";
  const headline =
    primaryItem(appointment.items)?.service_name ??
    appointment.business_unit_name;

  async function handleCancel() {
    try {
      await cancel.mutateAsync();
      toast.success("Tu cita fue cancelada.");
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
          {within24h && (
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Falta menos de 24 horas para tu cita. Si necesitas hacer cambios,
              llámanos a la sucursal.
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
        title="Cancelar cita"
        description="Esta acción no se puede deshacer."
        confirmLabel="Cancelar cita"
        cancelLabel="Volver"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancel.isPending}
      />
    </div>
  );
}
