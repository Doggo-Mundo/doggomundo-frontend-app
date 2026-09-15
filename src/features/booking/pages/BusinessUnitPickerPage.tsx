import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { BusinessUnitCard } from "@/features/booking/components/BusinessUnitCard";
import { useLocations } from "@/api/hooks/use-locations";
import { useServices } from "@/api/hooks/use-services";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { BOOKABLE_BUSINESS_UNITS } from "@/types/business-unit";
import type { BusinessUnitCode } from "@/types/business-unit";

export function BusinessUnitPickerPage() {
  const navigate = useNavigate();
  const current = useBookingFlowStore((s) => s.businessUnitCode);
  const setBusinessUnit = useBookingFlowStore((s) => s.setBusinessUnit);
  // Data-driven: sólo mostramos las BUs bookables que:
  // 1. Existen en al menos una Location activa.
  // 2. Tienen al menos UN servicio activo + reservable.
  // Sin la 2da regla, si el admin desactivaba TODOS los servicios
  // de un tipo (ej. todos los Grooming), el tipo seguía apareciendo
  // acá y el cliente aterrizaba en "No hay servicios disponibles"
  // dos pasos después.
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  // El backend ya filtra is_active=True y bookable=True — cualquier
  // service que salga acá cumple ambos.
  const { data: servicesData, isLoading: servicesLoading } = useServices();

  const codesWithLocations = useMemo(() => {
    const set = new Set<BusinessUnitCode>();
    for (const loc of locationsData?.results ?? []) {
      for (const bu of loc.business_units) {
        set.add(bu.code as BusinessUnitCode);
      }
    }
    return set;
  }, [locationsData]);
  const codesWithActiveServices = useMemo(() => {
    const set = new Set<BusinessUnitCode>();
    for (const service of servicesData?.results ?? []) {
      if (service.business_unit_code) {
        set.add(service.business_unit_code as BusinessUnitCode);
      }
    }
    return set;
  }, [servicesData]);

  const visibleUnits = useMemo(() => {
    // Mientras carga o si el fetch falla, dejamos todas las BUs
    // bookables visibles: peor UX es esconder algo real por un
    // error transitorio que dejar visible algo temporalmente
    // vacío. Los siguientes steps del wizard filtran igual.
    if (
      locationsLoading || servicesLoading
      || !locationsData || !servicesData
    ) {
      return BOOKABLE_BUSINESS_UNITS;
    }
    return BOOKABLE_BUSINESS_UNITS.filter(
      (code) =>
        codesWithLocations.has(code)
        && codesWithActiveServices.has(code),
    );
  }, [
    locationsLoading, servicesLoading,
    locationsData, servicesData,
    codesWithLocations, codesWithActiveServices,
  ]);

  function handleSelect(code: BusinessUnitCode) {
    setBusinessUnit(code);
    navigate("/book/service");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="business-unit"
        backTo="/"
        title="¿Qué vas a reservar?"
        description="Elige el tipo de servicio que buscas."
      />

      <ul className="space-y-2">
        {visibleUnits.map((code) => (
          <li key={code}>
            <BusinessUnitCard
              code={code}
              selected={current === code}
              onSelect={() => handleSelect(code)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
