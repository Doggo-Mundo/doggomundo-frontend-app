import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { WeekStrip } from "@/features/booking/components/WeekStrip";
import { SlotGrid } from "@/features/booking/components/SlotGrid";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyCalendarIllustration } from "@/components/shared/illustrations/EmptyCalendarIllustration";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useAvailableSlots } from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import { localDayBoundsUTC, toLocalDateISO } from "@/lib/format-date";
import { filterBookableSlots } from "@/features/booking/lib/filter-slots";
import type { AvailableSlot } from "@/types/appointment";

export function SlotPickerPage() {
  const navigate = useNavigate();
  const location = useBookingFlowStore((s) => s.location);
  const service = useBookingFlowStore((s) => s.service);
  const slot = useBookingFlowStore((s) => s.slot);
  const setSlot = useBookingFlowStore((s) => s.setSlot);
  const { data: petsData, isLoading: petsLoading } = usePets();

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

  useEffect(() => {
    if (!petsLoading && petsData && petsData.results.length === 0) {
      navigate("/pets/new", {
        replace: true,
        state: { from: "/book/slot" },
      });
    }
  }, [petsLoading, petsData, navigate]);

  if (!location) return <Navigate to="/book/location" replace />;
  if (!service) return <Navigate to="/book/service" replace />;

  function handleSelect(picked: AvailableSlot) {
    setSlot({
      slotId: picked.id,
      start: picked.start,
      end: picked.end,
      resource: picked.resource,
    });
    navigate("/book/pet");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="slot"
        backTo="/book/service"
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
