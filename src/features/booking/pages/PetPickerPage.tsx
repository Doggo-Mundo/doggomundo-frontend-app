import { Link, Navigate, useNavigate } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import type { PetListItem } from "@/types/pet";

export function PetPickerPage() {
  const navigate = useNavigate();
  const slot = useBookingFlowStore((s) => s.slot);
  const selected = useBookingFlowStore((s) => s.pet);
  const setPet = useBookingFlowStore((s) => s.setPet);
  const { data, isLoading, isError } = usePets();

  if (!slot) return <Navigate to="/book/slot" replace />;

  function handleSelect(pet: PetListItem) {
    setPet({ id: pet.id, name: pet.name });
    navigate("/book/review");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="pet"
        backTo="/book/slot"
        title="¿Para cuál de tus mascotas?"
      />

      {isLoading ? (
        <LoadingState rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus mascotas" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          illustration={<EmptyPawsIllustration />}
          title="Primero necesitas una mascota"
          action={
            <Button asChild>
              <Link to="/pets/new">
                <Plus />
                Agregar mascota
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
              const meta = pet.breed?.name ?? "Sin datos";
              return (
                <li key={pet.id}>
                  <button
                    type="button"
                    className="w-full text-left rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => handleSelect(pet)}
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
                            {meta}
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
                Agregar otra mascota
              </Link>
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
