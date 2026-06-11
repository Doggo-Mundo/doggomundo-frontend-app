import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import {
  FollowUpSuggestions,
  type FollowUpSuggestion,
} from "@/features/booking/components/FollowUpSuggestions";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import {
  useAvailableSlots,
  useCreateAppointment,
} from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import { formatLongDate, formatTime } from "@/lib/format-date";

const FOLLOWUP_WINDOW_HOURS = 8;

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
  const navigate = useNavigate();
  const state = useBookingFlowStore();
  const reset = useBookingFlowStore((s) => s.reset);
  const setPet = useBookingFlowStore((s) => s.setPet);
  const setSlot = useBookingFlowStore((s) => s.setSlot);
  const setNotes = useBookingFlowStore((s) => s.setNotes);
  const create = useCreateAppointment();

  const [error, setError] = useState<string | null>(null);

  // Other active pets the customer owns. After a successful booking these
  // are the candidates for the follow-up nudge. We compute it up-front so
  // both the success branch and the slot-query enabled flag can use it.
  const { data: petsData } = usePets();
  const otherPets = useMemo(() => {
    if (!petsData || !state.pet) return [];
    return petsData.results.filter(
      (p) => p.is_active && p.id !== state.pet!.id,
    );
  }, [petsData, state.pet]);

  // Fetch the next handful of available slots for the same service in the
  // same BU, starting right after the just-booked slot ends. Only fires
  // when there's at least one other pet to suggest to.
  const startAfter = state.slot?.end ?? null;
  const startBefore = useMemo(() => {
    if (!startAfter) return null;
    const t = new Date(startAfter).getTime();
    return new Date(t + FOLLOWUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  }, [startAfter]);
  const followUpEnabled =
    create.isSuccess &&
    otherPets.length > 0 &&
    !!state.location &&
    !!state.service &&
    !!startAfter &&
    !!startBefore;
  const { data: nextSlotsData, isLoading: slotsLoading } = useAvailableSlots(
    followUpEnabled
      ? {
          business_unit: state.location!.businessUnitId,
          service: state.service!.id,
          start_after: startAfter!,
          start_before: startBefore!,
        }
      : null,
    followUpEnabled,
  );

  // Pair each remaining pet with a distinct upcoming slot — pet[0] gets the
  // earliest free slot, pet[1] the next, etc. Capacity-aware: if there are
  // fewer slots than pets, only the pets that fit are surfaced.
  const suggestions: FollowUpSuggestion[] = useMemo(() => {
    if (!followUpEnabled || !nextSlotsData) return [];
    const available = nextSlotsData.results
      .filter((s) => s.is_available)
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
    return otherPets
      .slice(0, available.length)
      .map((pet, i) => ({ pet, slot: available[i] }));
  }, [followUpEnabled, nextSlotsData, otherPets]);

  // No follow-up to show → keep the legacy "auto-navigate after a beat"
  // behavior so the user isn't stuck on the success screen. When follow-up
  // suggestions ARE available we hold position and let them decide.
  const hasFollowUp = suggestions.length > 0;
  const followUpReady = !followUpEnabled || !slotsLoading;
  useEffect(() => {
    if (!create.isSuccess) return;
    if (!followUpReady) return;
    if (hasFollowUp) return;
    const t = setTimeout(() => {
      reset();
      navigate("/my/appointments", { replace: true });
    }, 2800);
    return () => clearTimeout(t);
  }, [create.isSuccess, followUpReady, hasFollowUp, reset, navigate]);

  if (create.isSuccess) {
    return (
      <SuccessScreen
        suggestions={suggestions}
        serviceName={state.service?.name ?? ""}
        servicePriceLabel={formatPriceLabel(state.service?.price)}
        onPickSuggestion={(s) => {
          // Swap pet + slot in the wizard, then drop `create.isSuccess` so
          // the page re-renders the regular review pane with the new pair
          // ready to confirm. BU/location/service/notes carry over.
          setPet({ id: s.pet.id, name: s.pet.name });
          setSlot({
            slotId: s.slot.id,
            start: s.slot.start,
            end: s.slot.end,
            resource: s.slot.resource,
          });
          create.reset();
          setError(null);
        }}
        onDone={() => {
          reset();
          navigate("/my/appointments", { replace: true });
        }}
      />
    );
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

function formatPriceLabel(price: string | undefined): string | null {
  if (!price) return null;
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("es-MX")}` : null;
}

interface SuccessScreenProps {
  suggestions: FollowUpSuggestion[];
  serviceName: string;
  servicePriceLabel: string | null;
  onPickSuggestion: (s: FollowUpSuggestion) => void;
  onDone: () => void;
}

function SuccessScreen({
  suggestions,
  serviceName,
  servicePriceLabel,
  onPickSuggestion,
  onDone,
}: SuccessScreenProps) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-8"
      role="status"
      aria-live="polite"
    >
      <SuccessCheckmark />

      <div className="text-center">
        <h2 className="text-2xl font-semibold">¡Listo!</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Tu cita quedó agendada. Te esperamos.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="w-full max-w-sm">
          <FollowUpSuggestions
            suggestions={suggestions}
            serviceName={serviceName}
            servicePriceLabel={servicePriceLabel}
            onPick={onPickSuggestion}
          />
        </div>
      )}

      <Button variant={suggestions.length > 0 ? "outline" : "default"} onClick={onDone}>
        Ver mis citas
      </Button>
    </div>
  );
}
