import { useLocations } from "@/api/hooks/use-locations";
import { BOOKING_STEPS } from "@/features/booking/lib/steps";
import type { BookingStep } from "@/features/booking/lib/steps";

interface EffectiveSteps {
  steps: BookingStep[];
  total: number;
  skipLocation: boolean;
}

/**
 * The booking wizard skips the "¿En qué sucursal?" step when there's only
 * one active sucursal in the system — it's busywork to pick from a list of
 * one. Step indices and totals reflow so the user sees "Paso 1 de 5"
 * instead of "Paso 1 de 6, jumping to 3 de 6".
 *
 * When a second location is registered the step automatically reappears
 * with no code change — the rule is just "1 sucursal → skip".
 */
export function useEffectiveBookingSteps(): EffectiveSteps {
  const { data } = useLocations();
  const totalLocations = data?.count ?? data?.results.length ?? 0;
  const skipLocation = totalLocations === 1;

  if (!skipLocation) {
    return { steps: BOOKING_STEPS, total: BOOKING_STEPS.length, skipLocation };
  }

  const steps = BOOKING_STEPS.filter((s) => s.key !== "location").map(
    (s, i) => ({ ...s, index: i + 1 }),
  );
  return { steps, total: steps.length, skipLocation };
}
