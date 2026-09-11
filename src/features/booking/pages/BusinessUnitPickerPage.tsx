import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { BusinessUnitCard } from "@/features/booking/components/BusinessUnitCard";
import { useLocations } from "@/api/hooks/use-locations";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { BOOKABLE_BUSINESS_UNITS } from "@/types/business-unit";
import type { BusinessUnitCode } from "@/types/business-unit";

export function BusinessUnitPickerPage() {
  const navigate = useNavigate();
  const current = useBookingFlowStore((s) => s.businessUnitCode);
  const setBusinessUnit = useBookingFlowStore((s) => s.setBusinessUnit);
  // Data-driven: sólo mostramos las BUs bookables que existen en
  // al menos una Location activa. Sin esto un cliente veía
  // "Doggo Foto" aunque no hubiera una sola sucursal con FOTO,
  // llegaba al LocationPicker y encontraba lista vacía. Cuando
  // se agrega una BU nueva en admin, aparece sin redeploy.
  const { data: locationsData, isLoading } = useLocations();
  const availableCodes = useMemo(() => {
    const set = new Set<BusinessUnitCode>();
    for (const loc of locationsData?.results ?? []) {
      for (const bu of loc.business_units) {
        set.add(bu.code as BusinessUnitCode);
      }
    }
    return set;
  }, [locationsData]);
  const visibleUnits = useMemo(() => {
    // Mientras carga o si el fetch falló, dejamos todas las BUs
    // bookables visibles: peor UX es esconder algo real por un
    // error transitorio que dejar visible algo temporalmente
    // vacío. El siguiente step del wizard filtra igual.
    if (isLoading || !locationsData) return BOOKABLE_BUSINESS_UNITS;
    return BOOKABLE_BUSINESS_UNITS.filter((code) => availableCodes.has(code));
  }, [isLoading, locationsData, availableCodes]);

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
