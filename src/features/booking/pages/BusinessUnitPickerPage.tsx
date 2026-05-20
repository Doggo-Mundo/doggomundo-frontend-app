import { useNavigate } from "react-router-dom";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { BusinessUnitCard } from "@/features/booking/components/BusinessUnitCard";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { BOOKABLE_BUSINESS_UNITS } from "@/types/business-unit";
import type { BusinessUnitCode } from "@/types/business-unit";

export function BusinessUnitPickerPage() {
  const navigate = useNavigate();
  const current = useBookingFlowStore((s) => s.businessUnitCode);
  const setBusinessUnit = useBookingFlowStore((s) => s.setBusinessUnit);

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
        {BOOKABLE_BUSINESS_UNITS.map((code) => (
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
