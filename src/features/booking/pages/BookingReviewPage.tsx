import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  PawPrint,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrors } from "@/components/shared/FormErrors";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { BookingSuccessAnimation } from "@/features/booking/components/BookingSuccessAnimation";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useCreateAppointment } from "@/api/hooks/use-appointments";
import { formatLongDate, formatTime } from "@/lib/format-date";

function extractApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "No pudimos crear la cita. Intenta de nuevo.";
  }
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, string[] | string | undefined>;
    // Prefer known "summary" keys first
    for (const key of ["detail", "non_field_errors", "error"]) {
      const val = record[key];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
    const firstKey = Object.keys(record)[0];
    if (firstKey) {
      const val = record[firstKey];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return "No pudimos crear la cita. Intenta de nuevo.";
}

export function BookingReviewPage() {
  const state = useBookingFlowStore();
  const reset = useBookingFlowStore((s) => s.reset);
  const setNotes = useBookingFlowStore((s) => s.setNotes);
  const create = useCreateAppointment();

  const [error, setError] = useState<string | null>(null);

  // Clear the wizard as soon as the booking is created. The success animation
  // doesn't read from the store, so resetting here leaves a clean slate for the
  // next visit to /book.
  useEffect(() => {
    if (create.isSuccess) reset();
  }, [create.isSuccess, reset]);

  if (create.isSuccess) {
    return <BookingSuccessAnimation />;
  }

  if (!state.location) return <Navigate to="/book/location" replace />;
  if (!state.service) return <Navigate to="/book/service" replace />;
  if (!state.slot) return <Navigate to="/book/slot" replace />;
  if (!state.pet) return <Navigate to="/book/pet" replace />;

  const price = Number(state.service.price);
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("es-MX")}`
      : null;

  async function handleConfirm() {
    if (!state.service || !state.location || !state.slot || !state.pet) return;

    setError(null);
    try {
      await create.mutateAsync({
        business_unit: state.location.businessUnitId,
        pet: state.pet.id,
        scheduled_start: state.slot.start,
        scheduled_end: state.slot.end,
        channel: "web",
        notes: state.notes || undefined,
        items: [
          {
            service: state.service.id,
            resource: state.slot.resource ?? undefined,
          },
        ],
      });
      // Success: the component re-renders and swaps to BookingSuccessAnimation,
      // which handles the navigation after its own animation finishes.
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="review"
        backTo="/book/pet"
        title="Revisa tu reserva"
        description="Confirma que todo esté bien antes de agendar."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.service.name}</p>
              <p className="text-xs text-muted-foreground">
                {state.service.durationMinutes} min
                {priceLabel && ` · ${priceLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize">
                {formatLongDate(state.slot.start)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(state.slot.start)} – {formatTime(state.slot.end)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.location.name}</p>
              <p className="text-xs text-muted-foreground">
                {state.location.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.pet.name}</p>
              {state.businessUnitCode === "FOTO" && (
                <p className="text-xs text-muted-foreground">
                  Si vienen más perritos, este es el principal — los demás
                  pueden acompañar.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Label htmlFor="notes" className="sr-only">
            Notas
          </Label>
          <Textarea
            id="notes"
            placeholder="¿Algo que el equipo deba saber? (opcional)"
            rows={3}
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </CardContent>
      </Card>

      <FormErrors message={error ?? undefined} />

      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={create.isPending}
      >
        {create.isPending ? "Agendando…" : "Confirmar reserva"}
      </Button>
    </div>
  );
}
