import { Navigate } from "react-router-dom";
import { useBookingFlowStore } from "@/stores/booking-flow-store";

export function BookingLandingPage() {
  const state = useBookingFlowStore();

  if (!state.businessUnitCode) return <Navigate to="/book/business-unit" replace />;
  if (!state.location) return <Navigate to="/book/location" replace />;
  if (!state.service) return <Navigate to="/book/service" replace />;
  if (!state.slot) return <Navigate to="/book/slot" replace />;
  if (!state.pet) return <Navigate to="/book/pet" replace />;
  return <Navigate to="/book/review" replace />;
}
