import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyPawsIllustration } from "@/components/shared/illustrations/EmptyPawsIllustration";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { usePets } from "@/api/hooks/use-pets";
import { useGroomingQuote } from "@/api/hooks/use-services";
import { cn } from "@/lib/utils";
import type { PetListItem } from "@/types/pet";

export function PetPickerPage() {
  const navigate = useNavigate();
  const service = useBookingFlowStore((s) => s.service);
  const selected = useBookingFlowStore((s) => s.pet);
  const setPet = useBookingFlowStore((s) => s.setPet);
  const updateServicePricing = useBookingFlowStore(
    (s) => s.updateServicePricing,
  );
  const { data, isLoading, isError } = usePets();

  // F-G.4: cuando el servicio usa la calculadora de tamaño/pelo, no
  // basta con elegir la mascota — hay que cotizar antes de avanzar a
  // horario (que ya debe mostrar/generar según la duración real).
  // `pendingPetId` marca "esperando la cotización de esta mascota";
  // null = nada en vuelo, listo para elegir.
  const [pendingPetId, setPendingPetId] = useState<string | null>(null);
  const isMatrix = service?.pricingMode === "SIZE_COAT_MATRIX";

  const quoteParams =
    service && pendingPetId
      ? { service: service.id, pet: pendingPetId }
      : null;
  const {
    data: quote,
    isLoading: quoting,
    isError: quoteFailed,
    error: quoteError,
  } = useGroomingQuote(quoteParams);

  useEffect(() => {
    if (!pendingPetId || !quote) return;
    const pendingPet = data?.results.find((p) => p.id === pendingPetId);
    if (!pendingPet) return;
    setPet({ id: pendingPetId, name: pendingPet.name });
    updateServicePricing(quote.price, quote.duration_minutes);
    // F-G extras-at-check-in: la página de opciones de grooming
    // decide por sí misma si se adelanta a /book/slot (catálogo
    // vacío para esta unidad) — mismo patrón que el paso de addons.
    navigate("/book/grooming-extras");
  }, [quote, pendingPetId, data, setPet, updateServicePricing, navigate]);

  if (!service) return <Navigate to="/book/service" replace />;

  function handleSelect(pet: PetListItem) {
    if (!isMatrix) {
      setPet({ id: pet.id, name: pet.name });
      navigate("/book/slot");
      return;
    }
    setPendingPetId(pet.id);
  }

  const quoteErrorMessage =
    quoteFailed && axios.isAxiosError(quoteError)
      ? (quoteError.response?.data as { error?: string } | undefined)?.error
      : null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="pet"
        backTo="/book/service"
        title="¿Para cuál de tus Doggos?"
      />

      {quoteErrorMessage && (
        <Card size="sm" className="border-destructive/40 bg-destructive/5">
          <div className="space-y-2 px-3">
            <p className="text-sm text-destructive">{quoteErrorMessage}</p>
            {pendingPetId && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/pets/${pendingPetId}/edit`}>
                  Completar perfil
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}

      {isLoading ? (
        <LoadingState rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus Doggos" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          illustration={<EmptyPawsIllustration />}
          title="Primero necesitas registrar un Doggo"
          action={
            <Button asChild>
              <Link to="/pets/new">
                <Plus />
                Agregar Doggo
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.results
            .filter((p) => p.is_active)
            .map((pet) => {
              const active = selected?.id === pet.id;
              const isQuotingThis = quoting && pendingPetId === pet.id;
              const meta = pet.breed?.name ?? "Sin datos";
              return (
                <li key={pet.id}>
                  <button
                    type="button"
                    className="w-full text-left rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                    onClick={() => handleSelect(pet)}
                    disabled={quoting}
                    aria-pressed={active}
                  >
                    <Card
                      size="sm"
                      className={cn(
                        "transition-all",
                        active
                          ? "ring-2 ring-primary bg-secondary"
                          : "hover:shadow-md",
                      )}
                    >
                      <div className="flex items-center gap-3 px-3">
                        <PetAvatar name={pet.name} photo={pet.photo} />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isQuotingThis ? "Cotizando…" : meta}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </button>
                </li>
              );
            })}
          <li>
            <Button asChild variant="outline" className="w-full">
              <Link to="/pets/new" state={{ from: "/book/pet" }}>
                <Plus />
                Agregar otro Doggo
              </Link>
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
