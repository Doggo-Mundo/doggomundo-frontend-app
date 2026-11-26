import { Navigate } from "react-router-dom";
import { useBookingFlowStore } from "@/stores/booking-flow-store";

export function BookingLandingPage() {
  const state = useBookingFlowStore();

  if (!state.businessUnitCode) return <Navigate to="/book/business-unit" replace />;
  if (!state.location) return <Navigate to="/book/location" replace />;
  if (!state.service) return <Navigate to="/book/service" replace />;
  // Mismo orden que BOOKING_STEPS: mascota antes que horario (la
  // duración real depende de la mascota). Sin mascota → /book/pet;
  // con mascota pero sin horario → /book/grooming-extras, que se
  // auto-adelanta a /book/slot cuando no aplica.
  if (!state.pet) return <Navigate to="/book/pet" replace />;
  if (!state.slot) {
    return (
      <Navigate
        to={
          state.service.pricingMode === "SIZE_COAT_MATRIX"
            ? "/book/grooming-extras"
            : "/book/slot"
        }
        replace
      />
    );
  }
  return <Navigate to="/book/review" replace />;
}
