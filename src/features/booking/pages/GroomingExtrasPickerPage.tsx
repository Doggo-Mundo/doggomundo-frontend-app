import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { useGroomingQuote } from "@/api/hooks/use-services";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { cn } from "@/lib/utils";
import type { GroomingQuoteExtra } from "@/types/grooming-quote";

/**
 * F-G extras-at-check-in: paso opcional para pre-seleccionar extras
 * de grooming (ej. "Perfume", "Desenredado") antes de elegir
 * horario. Solo tiene sentido para servicios con calculadora de
 * tamaño/pelo — re-pide la misma cotización que ya se pidió en
 * PetPickerPage (misma query key, sirve del caché) para leer su
 * `extras[]` sin depender de pasar datos por el router.
 *
 * Auto-skip: si el servicio no es de matriz, o el catálogo de
 * extras de la unidad está vacío, se adelanta a /book/slot — mismo
 * patrón que AddOnsPickerPage con /book/review.
 */
export function GroomingExtrasPickerPage() {
  const navigate = useNavigate();
  const service = useBookingFlowStore((s) => s.service);
  const pet = useBookingFlowStore((s) => s.pet);
  const groomingExtras = useBookingFlowStore((s) => s.groomingExtras);
  const toggleGroomingExtra = useBookingFlowStore((s) => s.toggleGroomingExtra);

  const isMatrix = service?.pricingMode === "SIZE_COAT_MATRIX";
  const quoteParams =
    isMatrix && service && pet ? { service: service.id, pet: pet.id } : null;
  const { data: quote, isLoading, isError } = useGroomingQuote(quoteParams);

  const extras = quote?.extras ?? [];

  useEffect(() => {
    if (!isMatrix) {
      navigate("/book/slot", { replace: true });
      return;
    }
    if (!isLoading && !isError && extras.length === 0) {
      navigate("/book/slot", { replace: true });
    }
  }, [isMatrix, isLoading, isError, extras.length, navigate]);

  if (!service) return <Navigate to="/book/service" replace />;
  if (!pet) return <Navigate to="/book/pet" replace />;

  function handleContinue() {
    navigate("/book/slot");
  }

  function priceLabel(extra: GroomingQuoteExtra): string {
    return extra.is_fixed_price
      ? `$${extra.price_min}`
      : `$${extra.price_min}–$${extra.price_max}`;
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="grooming-extras"
        backTo="/book/pet"
        title="¿Algo más para tu Doggo?"
        description="Opcional. Estos se cobran junto con el servicio; los de precio variable se confirman con el tamaño real en recepción."
      />

      {!isMatrix || (!isLoading && !isError && extras.length === 0) ? (
        // Ephemeral — el efecto de arriba adelanta en un render.
        <div className="h-24" />
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          No pudimos cargar las opciones. Puedes seguir sin ellas.
        </p>
      ) : (
        <ul className="space-y-2">
          {extras.map((extra) => {
            const selected = groomingExtras.some((e) => e.id === extra.id);
            return (
              <li key={extra.id}>
                <button
                  type="button"
                  className="w-full text-left rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() =>
                    toggleGroomingExtra({
                      id: extra.id,
                      name: extra.name,
                      priceMin: extra.price_min,
                      priceMax: extra.price_max,
                      isFixedPrice: extra.is_fixed_price,
                    })
                  }
                  aria-pressed={selected}
                >
                  <Card
                    size="sm"
                    className={cn(
                      "transition-all",
                      selected
                        ? "ring-2 ring-primary bg-secondary"
                        : "hover:shadow-md",
                    )}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-medium">
                          {extra.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {priceLabel(extra)}
                          {!extra.is_fixed_price && " · se confirma en recepción"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {extras.length > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
          <Button size="lg" className="w-full" onClick={handleContinue}>
            {groomingExtras.length === 0
              ? "Seguir sin opciones"
              : groomingExtras.length === 1
                ? "Continuar con 1 opción"
                : `Continuar con ${groomingExtras.length} opciones`}
          </Button>
        </div>
      )}
    </div>
  );
}
