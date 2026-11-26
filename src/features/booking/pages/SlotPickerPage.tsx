import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Clock } from "lucide-react";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { WeekStrip } from "@/features/booking/components/WeekStrip";
import { SlotGrid } from "@/features/booking/components/SlotGrid";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyCalendarIllustration } from "@/components/shared/illustrations/EmptyCalendarIllustration";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useAvailability } from "@/api/hooks/use-appointments";
import { useGroomingQuote } from "@/api/hooks/use-services";
import { toLocalDateISO } from "@/lib/format-date";
import type { PetPickerLocationState } from "@/features/booking/pages/PetPickerPage";
import type {
  AvailabilityErrorBody,
  AvailabilityStart,
} from "@/types/appointment";

function availabilityError(err: unknown): AvailabilityErrorBody | null {
  if (!axios.isAxiosError(err)) return null;
  const data = err.response?.data;
  return data && typeof data === "object" ? (data as AvailabilityErrorBody) : null;
}

export function SlotPickerPage() {
  const navigate = useNavigate();
  const location = useBookingFlowStore((s) => s.location);
  const service = useBookingFlowStore((s) => s.service);
  const pet = useBookingFlowStore((s) => s.pet);
  const slot = useBookingFlowStore((s) => s.slot);
  const setSlot = useBookingFlowStore((s) => s.setSlot);

  // `date` es el día local CDMX (YYYY-MM-DD) — lo mismo que espera
  // GET /appointments/availability/.
  const [date, setDate] = useState<string>(() => toLocalDateISO(new Date()));
  const isMatrix = service?.pricingMode === "SIZE_COAT_MATRIX";

  const queryParams = useMemo(() => {
    if (!service || !pet) return null;
    return { service: service.id, date, pet: pet.id };
  }, [service, pet, date]);

  const { data, isLoading, isError, error } = useAvailability(queryParams);
  const errorBody = isError ? availabilityError(error) : null;
  const petMissingData = errorBody?.code === "pet_missing_data";

  // "Atrás" debe volver a opciones de grooming solo si ese paso de
  // verdad se mostró — si el catálogo de extras está vacío esa página
  // se auto-adelanta a /book/slot y el botón rebotaría hacia acá. La
  // cotización ya está en caché desde el paso de mascota.
  const { data: quote } = useGroomingQuote(
    isMatrix && service && pet ? { service: service.id, pet: pet.id } : null,
  );
  const backTo =
    isMatrix && (quote?.extras.length ?? 0) > 0
      ? "/book/grooming-extras"
      : "/book/pet";

  useEffect(() => {
    if (!petMissingData || !pet) return;
    // Sin peso/pelo no hay duración real: de vuelta al paso de
    // mascota, que abre la captura inline para esta mascota.
    const state: PetPickerLocationState = { needsGroomingDataFor: pet.id };
    navigate("/book/pet", { replace: true, state });
  }, [petMissingData, pet, navigate]);

  if (!location) return <Navigate to="/book/location" replace />;
  if (!service) return <Navigate to="/book/service" replace />;
  // F-G.4: pet se elige ANTES que horario — la duración real (y por
  // tanto qué inicios caben) depende de la mascota.
  if (!pet) return <Navigate to="/book/pet" replace />;

  function handleSelect(picked: AvailabilityStart) {
    setSlot({
      slotId: picked.slot_id,
      start: picked.start,
      end: picked.end,
      resource: picked.resource,
    });
    // F4-D: el siguiente paso es el opcional de add-ons.
    navigate("/book/addons");
  }

  const starts = data?.starts ?? [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="slot"
        backTo={backTo}
        title="¿Cuándo?"
        description={`${service.name} · ${location.name}`}
      />

      <WeekStrip value={date} onChange={setDate} />

      {data && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Duración aprox. {data.duration_minutes} min
          {isMatrix && ` para ${pet.name}`}
        </p>
      )}

      {isLoading || petMissingData ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <EmptyState
          title="No pudimos cargar la disponibilidad"
          description={errorBody?.error}
        />
      ) : starts.length === 0 ? (
        <EmptyState
          illustration={<EmptyCalendarIllustration />}
          title="No hay horarios disponibles"
          description="Prueba otro día."
        />
      ) : (
        <SlotGrid
          slots={starts}
          selectedStart={slot?.start ?? null}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
