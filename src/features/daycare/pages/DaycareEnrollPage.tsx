import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Infinity as InfinityIcon,
  MapPin,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormErrors } from "@/components/shared/FormErrors";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { BackLink } from "@/features/pets/components/BackLink";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { formatMoney } from "@/features/orders/lib/format-money";
import { extractDaycareError } from "@/features/daycare/lib/extract-error";
import {
  useCreateEnrollment,
  usePetProfile,
  usePlan,
} from "@/api/hooks/use-daycare";
import { useLocations } from "@/api/hooks/use-locations";
import { usePets } from "@/api/hooks/use-pets";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { DaycareEnrollment } from "@/types/daycare";
import type { LocationListItem } from "@/types/location";
import type { PetListItem } from "@/types/pet";

export function DaycareEnrollPage() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading: planLoading, isError: planError } = usePlan(
    planId ?? "",
  );
  const { data: petsData, isLoading: petsLoading } = usePets();
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const create = useCreateEnrollment();

  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  // null = use the auto-picked default (first location). Once the user
  // clicks one explicitly, this holds that id and overrides the default.
  const [locationOverride, setLocationOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdEnrollment, setCreatedEnrollment] =
    useState<DaycareEnrollment | null>(null);

  const selectedPetProfile = usePetProfile(selectedPet ?? "");
  const isSelectedPetEligible =
    !!selectedPet && selectedPetProfile.data?.can_book === true;

  // Effective location resolves at render time — first location by default,
  // overridden once the user picks one. Avoids a setState-in-effect cascade.
  const selectedLocation = useMemo(
    () => locationOverride ?? locationsData?.results[0]?.id ?? null,
    [locationOverride, locationsData],
  );

  if (!planId) return <Navigate to="/daycare" replace />;

  // ---------- Success state ----------

  if (createdEnrollment) {
    return <EnrollSuccess enrollment={createdEnrollment} />;
  }

  // ---------- Loading ----------

  if (planLoading || petsLoading || locationsLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare" label="Day Care" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare" label="Day Care" />
        <EmptyState
          title="No pudimos cargar este plan"
          description="Puede que ya no esté disponible."
        />
      </div>
    );
  }

  const activePets = petsData?.results.filter((p) => p.is_active) ?? [];
  const activeLocations = locationsData?.results ?? [];

  // ---------- Submit ----------

  async function handleConfirm() {
    if (!planId || !selectedPet || !selectedLocation) return;
    setError(null);
    try {
      const enrollment = await create.mutateAsync({
        pet: selectedPet,
        plan: planId,
        location: selectedLocation,
      });
      setCreatedEnrollment(enrollment);
    } catch (err) {
      setError(extractDaycareError(err, "No pudimos crear la inscripción."));
    }
  }

  const isUnlimited = plan.credits_included === null;
  const canSubmit =
    !!selectedPet && !!selectedLocation && isSelectedPetEligible;

  return (
    <div className="space-y-5">
      <BackLink to="/daycare" label="Day Care" />

      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {plan.plan_type_display}
        </p>
        <h1 className="text-2xl font-semibold">{plan.name}</h1>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
      </header>

      {/* Plan summary */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Precio
            </p>
            <p className="text-lg font-semibold">{formatMoney(plan.price)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Visitas
            </p>
            <p className="flex items-center gap-1 font-medium">
              {isUnlimited ? (
                <>
                  <InfinityIcon className="h-4 w-4" />
                  Ilimitadas
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  {plan.credits_included}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Vigencia
            </p>
            <p className="flex items-center gap-1 font-medium">
              <Clock className="h-4 w-4" />
              {plan.validity_days} días
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pet selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Para cuál mascota?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {activePets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero{" "}
              <Link to="/pets/new" className="font-medium text-primary underline">
                agrega una mascota
              </Link>
              .
            </p>
          ) : (
            activePets.map((pet) => (
              <PetOption
                key={pet.id}
                pet={pet}
                selected={selectedPet === pet.id}
                onSelect={() => setSelectedPet(pet.id)}
              />
            ))
          )}
          {selectedPet && !isSelectedPetEligible && !selectedPetProfile.isLoading && (
            <p className="text-xs text-destructive">
              Esta mascota no está aprobada para day care. Solicita su
              evaluación desde su perfil.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Dónde?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {activeLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay sucursales activas.
            </p>
          ) : (
            activeLocations.map((loc) => (
              <LocationOption
                key={loc.id}
                location={loc}
                selected={selectedLocation === loc.id}
                onSelect={() => setLocationOverride(loc.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Honest payment mockup banner */}
      <div
        className="flex items-start gap-2 rounded-md border border-dashed bg-surface-soft p-3 text-xs text-surface-soft-foreground"
        role="note"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Simulación.</strong> El pago en línea todavía no está activo —
          tu plan queda activo desde ya y el pago se cierra en sucursal.
        </p>
      </div>

      <FormErrors message={error ?? undefined} />

      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={!canSubmit || create.isPending}
      >
        {create.isPending
          ? "Confirmando…"
          : `Confirmar · ${formatMoney(plan.price)}`}
      </Button>
    </div>
  );
}

// ---------- Sub-components ----------

interface PetOptionProps {
  pet: PetListItem;
  selected: boolean;
  onSelect: () => void;
}

function PetOption({ pet, selected, onSelect }: PetOptionProps) {
  const { data: profile, isLoading } = usePetProfile(pet.id);
  const eligible = profile?.can_book === true;
  const status = profile?.evaluation_status ?? "not_requested";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!eligible}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && eligible
          ? "border-primary bg-secondary"
          : "border-border bg-background",
        eligible
          ? "hover:bg-muted"
          : "cursor-not-allowed opacity-60",
      )}
    >
      <PetAvatar name={pet.name} photo={pet.photo} size="sm" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">{pet.name}</p>
        <p className="text-xs text-muted-foreground">
          {isLoading
            ? "Cargando estado…"
            : profile?.evaluation_status_display ?? "Sin evaluar"}
        </p>
      </div>
      {eligible && (
        <CheckCircle2
          className={cn(
            "h-4 w-4 shrink-0",
            selected ? "text-primary" : "text-muted-foreground/40",
          )}
        />
      )}
      {!eligible && !isLoading && status !== "approved" && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          No elegible
        </span>
      )}
    </button>
  );
}

interface LocationOptionProps {
  location: LocationListItem;
  selected: boolean;
  onSelect: () => void;
}

function LocationOption({ location, selected, onSelect }: LocationOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-secondary"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">{location.name}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {location.address}
        </p>
      </div>
      <CheckCircle2
        className={cn(
          "h-4 w-4 shrink-0",
          selected ? "text-primary" : "text-muted-foreground/40",
        )}
      />
    </button>
  );
}

// ---------- Success state ----------

interface EnrollSuccessProps {
  enrollment: DaycareEnrollment;
}

function EnrollSuccess({ enrollment }: EnrollSuccessProps) {
  const creditsLabel = enrollment.is_unlimited
    ? "Visitas ilimitadas"
    : enrollment.credits_remaining === 1
      ? "1 crédito disponible"
      : `${enrollment.credits_remaining ?? 0} créditos disponibles`;

  useEffect(() => {
    toast.success("¡Tu plan está activo!");
  }, []);

  return (
    <div
      className="mx-auto max-w-md space-y-6 py-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">
        <SuccessCheckmark />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">¡Listo, ya estás dentro!</h1>
        <p className="text-sm text-muted-foreground">
          Tu plan está activo desde hoy y vence el{" "}
          {formatDate(enrollment.expires_at)}.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium">{enrollment.plan_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mascota</span>
            <span className="text-sm font-medium">{enrollment.pet_name}</span>
          </div>
          <hr className="border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Disponibilidad</span>
            <span className="text-lg font-semibold">{creditsLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div
        className="flex items-start gap-2 rounded-md bg-muted p-3 text-left text-xs text-muted-foreground"
        role="note"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Pago pendiente — se cierra en sucursal por ahora. Cuando llegue el
          pago en línea, lo encontrarás aquí.
        </p>
      </div>

      <div className="space-y-2">
        <Button asChild size="lg" className="w-full">
          <Link to="/daycare/book">
            Reservar mi primer día
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to="/daycare">Volver a Day Care</Link>
        </Button>
      </div>
    </div>
  );
}
