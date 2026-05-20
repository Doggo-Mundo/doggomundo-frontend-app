import { Link } from "react-router-dom";
import { PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyPawsIllustration } from "@/components/shared/illustrations/EmptyPawsIllustration";
import { PetListSkeleton } from "@/components/shared/skeletons/PetCardSkeleton";
import { PetCard } from "@/features/pets/components/PetCard";
import { OnboardingBanner } from "@/features/pets/components/OnboardingBanner";
import { usePets } from "@/api/hooks/use-pets";

export function PetListPage() {
  const { data, isLoading, isError } = usePets();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mis mascotas</h1>
          <p className="text-sm text-muted-foreground">
            Registra sus datos para reservar servicios.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/pets/new">
            <Plus />
            Agregar
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <PetListSkeleton rows={2} />
      ) : isError ? (
        <EmptyState
          icon={<PawPrint className="h-12 w-12" />}
          title="No pudimos cargar tus mascotas"
          description="Revisa tu conexión e intenta de nuevo."
        />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          illustration={<EmptyPawsIllustration />}
          title="Aún no has registrado ninguna mascota"
          description="Agrega la primera para comenzar a reservar servicios."
          action={
            <Button asChild>
              <Link to="/pets/new">
                <Plus />
                Agregar mi primera mascota
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <OnboardingBanner pets={data.results} />
          <ul className="space-y-3">
            {data.results.map((pet) => (
              <li key={pet.id}>
                <PetCard pet={pet} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
