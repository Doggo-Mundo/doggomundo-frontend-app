import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { WeekStrip } from "@/features/booking/components/WeekStrip";
import { SlotGrid } from "@/features/booking/components/SlotGrid";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyCalendarIllustration } from "@/components/shared/illustrations/EmptyCalendarIllustration";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useAvailableSlots } from "@/api/hooks/use-appointments";
import { localDayBoundsUTC, toLocalDateISO } from "@/lib/format-date";
import { filterBookableSlots } from "@/features/booking/lib/filter-slots";
import type { AvailableSlot } from "@/types/appointment";

export function SlotPickerPage() {
  const navigate = useNavigate();
  const location = useBookingFlowStore((s) => s.location);
  const service = useBookingFlowStore((s) => s.service);
  const pet = useBookingFlowStore((s) => s.pet);
  const slot = useBookingFlowStore((s) => s.slot);
  const setSlot = useBookingFlowStore((s) => s.setSlot);

  const [date, setDate] = useState<string>(() => toLocalDateISO(new Date()));

  const queryParams = useMemo(() => {
    if (!location || !service) return null;
    const { startUTC, endUTC } = localDayBoundsUTC(date);
    return {
      business_unit: location.businessUnitId,
      service: service.id,
      start_after: startUTC,
      start_before: endUTC,
    };
  }, [location, service, date]);

  const { data, isLoading, isError } = useAvailableSlots(queryParams);

  const slots = useMemo(
    () => filterBookableSlots(data?.results ?? []),
    [data],
  );

  if (!location) return <Navigate to="/book/location" replace />;
  if (!service) return <Navigate to="/book/service" replace />;
  // F-G.4: pet ahora se elige ANTES que horario — para cuando se
  // llega acá ya debe haber una mascota (y, si el servicio usa la
  // calculadora, el precio/duración del store ya está actualizado
  // con la cotización real). Sin esto no hay forma de llegar a esta
  // página con pets.length === 0 — PetPickerPage ya resuelve ese
  // caso con su propio EmptyState, así que no hace falta duplicar
  // ese chequeo aquí.
  if (!pet) return <Navigate to="/book/pet" replace />;

  function handleSelect(picked: AvailableSlot) {
    setSlot({
      slotId: picked.id,
      start: picked.start,
      end: picked.end,
      resource: picked.resource,
    });
    // F4-D: el siguiente paso es el opcional de add-ons.
    navigate("/book/addons");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="slot"
        backTo="/book/pet"
        title="¿Cuándo?"
        description={`${service.name} · ${location.name}`}
      />

      <WeekStrip value={date} onChange={setDate} />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar la disponibilidad" />
      ) : slots.length === 0 ? (
        <EmptyState
          illustration={<EmptyCalendarIllustration />}
          title="No hay horarios disponibles"
          description="Prueba otro día."
        />
      ) : (
        <SlotGrid
          slots={slots}
          selectedStart={slot?.start ?? null}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
