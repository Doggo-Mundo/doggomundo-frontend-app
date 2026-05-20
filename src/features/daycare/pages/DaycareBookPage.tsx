import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Infinity as InfinityIcon,
  MapPin,
  Sparkles,
  Ticket,
} from "lucide-react";
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { LoadingState } from "@/components/shared/LoadingState";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { BackLink } from "@/features/pets/components/BackLink";
import { DaycareCalendar } from "@/features/daycare/components/DaycareCalendar";
import { extractDaycareError } from "@/features/daycare/lib/extract-error";
import {
  useAvailability,
  useCreateDays,
  useEnrollments,
} from "@/api/hooks/use-daycare";
import { useLocations } from "@/api/hooks/use-locations";
import { TIMEZONE, formatDate, toLocalDateISO } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
  DaycareDay,
  DaycareEnrollmentList,
} from "@/types/daycare";
import type { LocationListItem } from "@/types/location";
import { toZonedTime } from "date-fns-tz";

export function DaycareBookPage() {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } =
    useEnrollments();
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const create = useCreateDays();

  const [enrollmentOverride, setEnrollmentOverride] = useState<string | null>(
    null,
  );
  const [locationOverride, setLocationOverride] = useState<string | null>(null);
  const [monthDate, setMonthDate] = useState<Date>(
    () => toZonedTime(new Date(), TIMEZONE),
  );
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  // Tracks which enrollment the current selection belongs to. When the user
  // switches enrollments, the selection auto-resets — done via the
  // "store-prop-in-state" pattern that React docs recommend instead of an
  // effect, so the lint rule against setState-in-effect stays happy.
  const [selectionEnrollmentId, setSelectionEnrollmentId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [createdDays, setCreatedDays] = useState<DaycareDay[] | null>(null);

  // Active enrollments, sorted by expires_at ASC so we consume the soonest first.
  const activeEnrollments = useMemo(
    () =>
      (enrollmentsData?.results ?? [])
        .filter((e) => e.status === "active")
        .sort((a, b) => a.expires_at.localeCompare(b.expires_at)),
    [enrollmentsData],
  );

  const selectedEnrollment = useMemo(
    () =>
      activeEnrollments.find((e) => e.id === enrollmentOverride) ??
      activeEnrollments[0] ??
      null,
    [activeEnrollments, enrollmentOverride],
  );

  const selectedLocation = useMemo<LocationListItem | null>(
    () =>
      (locationsData?.results ?? []).find(
        (l) => l.id === (locationOverride ?? locationsData?.results[0]?.id),
      ) ?? null,
    [locationsData, locationOverride],
  );

  const monthBounds = useMemo(
    () => ({
      date_from: format(startOfMonth(monthDate), "yyyy-MM-dd"),
      date_to: format(endOfMonth(monthDate), "yyyy-MM-dd"),
    }),
    [monthDate],
  );

  const { data: availability, isLoading: availabilityLoading } = useAvailability(
    selectedLocation
      ? { location: selectedLocation.id, ...monthBounds }
      : null,
  );

  // Reset selection when the active enrollment changes (different vigencia /
  // credit limit). Runs during render — supported pattern for "derive state
  // from props" without an effect.
  if (selectedEnrollment && selectedEnrollment.id !== selectionEnrollmentId) {
    setSelectionEnrollmentId(selectedEnrollment.id);
    setSelectedDates(new Set());
  }

  // ---------- Guards ----------

  if (enrollmentsLoading || locationsLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare" label="Day Care" />
        <LoadingState rows={4} />
      </div>
    );
  }

  if (activeEnrollments.length === 0) {
    return <NoActiveEnrollmentRedirect />;
  }

  if (!selectedEnrollment || !selectedLocation) {
    return (
      <div className="space-y-4">
        <BackLink to="/daycare" label="Day Care" />
        <LoadingState rows={2} />
      </div>
    );
  }

  // ---------- Success state ----------

  if (createdDays) {
    return (
      <BookingSuccessState
        days={createdDays}
        onReserveMore={() => {
          setCreatedDays(null);
          setSelectedDates(new Set());
        }}
      />
    );
  }

  // ---------- Computed ----------

  const todayISO = toLocalDateISO(new Date());
  const isUnlimited = selectedEnrollment.is_unlimited;
  const creditsRemaining = selectedEnrollment.credits_remaining ?? 0;
  const selectedCount = selectedDates.size;
  const atCreditLimit =
    !isUnlimited && selectedCount >= creditsRemaining;
  const overBudget =
    !isUnlimited && selectedCount > creditsRemaining;

  function handleToggle(iso: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  async function handleReserve() {
    if (!selectedEnrollment || !selectedLocation || selectedCount === 0) return;
    setError(null);
    const dates = Array.from(selectedDates).sort();
    try {
      const days = await create.mutateAsync({
        enrollment: selectedEnrollment.id,
        pet: selectedEnrollment.pet,
        location: selectedLocation.id,
        dates,
      });
      setCreatedDays(days);
    } catch (err) {
      setError(extractDaycareError(err, "No pudimos crear la reserva."));
    }
  }

  return (
    <div className="space-y-5">
      <BackLink to="/daycare" label="Day Care" />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reservar día(s)</h1>
        <p className="text-sm text-muted-foreground">
          Elige uno o más días disponibles para {selectedEnrollment.pet_name}.
        </p>
      </header>

      {/* Enrollment selector — only shown if 2+ active */}
      {activeEnrollments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Qué plan vas a usar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {activeEnrollments.map((e) => (
              <EnrollmentOption
                key={e.id}
                enrollment={e}
                selected={selectedEnrollment.id === e.id}
                onSelect={() => setEnrollmentOverride(e.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Single enrollment summary */}
      {activeEnrollments.length === 1 && (
        <EnrollmentSummaryCard enrollment={selectedEnrollment} />
      )}

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Dónde?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {(locationsData?.results ?? []).map((loc) => (
            <LocationOption
              key={loc.id}
              location={loc}
              selected={selectedLocation.id === loc.id}
              onSelect={() => setLocationOverride(loc.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="py-4">
          <DaycareCalendar
            monthDate={monthDate}
            onMonthChange={setMonthDate}
            availability={availability ?? []}
            selected={selectedDates}
            onToggle={handleToggle}
            todayISO={todayISO}
            enrollmentStartISO={selectedEnrollment.started_at}
            enrollmentEndISO={selectedEnrollment.expires_at}
            atCreditLimit={atCreditLimit}
            isLoading={availabilityLoading}
          />
        </CardContent>
      </Card>

      <CalendarLegend />

      {/* Selection summary + CTA */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {selectedCount === 0
                ? "Sin días seleccionados"
                : selectedCount === 1
                  ? "1 día seleccionado"
                  : `${selectedCount} días seleccionados`}
            </span>
            <span className="text-sm text-muted-foreground">
              {isUnlimited
                ? "Visitas ilimitadas"
                : `${creditsRemaining - selectedCount} créditos restantes`}
            </span>
          </div>

          {overBudget && (
            <p className="text-xs text-destructive">
              Te faltan {selectedCount - creditsRemaining} créditos. Quita
              algunos días o compra un plan adicional.
            </p>
          )}

          <FormErrors message={error ?? undefined} />

          <Button
            size="lg"
            className="w-full"
            onClick={handleReserve}
            disabled={
              selectedCount === 0 || overBudget || create.isPending
            }
          >
            {create.isPending
              ? "Reservando…"
              : selectedCount === 0
                ? "Elige al menos un día"
                : `Reservar ${selectedCount} día${selectedCount === 1 ? "" : "s"}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Sub-components ----------

function NoActiveEnrollmentRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    toast.info("Compra un plan primero para reservar días.");
    navigate("/daycare", { replace: true });
  }, [navigate]);
  return <Navigate to="/daycare" replace />;
}

interface EnrollmentOptionProps {
  enrollment: DaycareEnrollmentList;
  selected: boolean;
  onSelect: () => void;
}

function EnrollmentOption({
  enrollment,
  selected,
  onSelect,
}: EnrollmentOptionProps) {
  const credits = enrollment.is_unlimited
    ? "Ilimitado"
    : `${enrollment.credits_remaining ?? 0} créditos`;
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
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">
          {enrollment.plan_name} · {enrollment.pet_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {credits} · vence el {formatDate(enrollment.expires_at)}
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

interface EnrollmentSummaryCardProps {
  enrollment: DaycareEnrollmentList;
}

function EnrollmentSummaryCard({ enrollment }: EnrollmentSummaryCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
        <p className="font-medium">{enrollment.plan_name}</p>
        <span className="flex items-center gap-1 text-muted-foreground">
          {enrollment.is_unlimited ? (
            <>
              <InfinityIcon className="h-3.5 w-3.5" />
              Ilimitado
            </>
          ) : (
            <>
              <Ticket className="h-3.5 w-3.5" />
              {enrollment.credits_remaining ?? 0} créditos
            </>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          vence el {formatDate(enrollment.expires_at)}
        </span>
      </CardContent>
    </Card>
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

function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <LegendItem className="border-primary bg-primary" label="Seleccionado" />
      <LegendItem className="border-border bg-background" label="Disponible" />
      <LegendItem
        className="border-destructive/30 bg-destructive/5"
        label="Lleno"
      />
      <LegendItem className="border-border/50 bg-muted/40" label="Cerrado" />
    </div>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded border", className)} />
      {label}
    </span>
  );
}

// ---------- Success state ----------

interface BookingSuccessProps {
  days: DaycareDay[];
  onReserveMore: () => void;
}

function BookingSuccessState({ days, onReserveMore }: BookingSuccessProps) {
  useEffect(() => {
    toast.success("¡Reserva confirmada!");
  }, []);

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const count = days.length;

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
        <h1 className="text-2xl font-semibold">
          {count === 1 ? "¡Día reservado!" : `¡${count} días reservados!`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Te esperamos. Llega cualquier momento durante el horario.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4 text-left">
          {sorted.map((day) => (
            <div
              key={day.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="capitalize">
                  {format(parseISO(day.date), "EEEE d 'de' MMMM", { locale: es })}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {day.location_name}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button asChild size="lg" className="w-full">
          <Link to="/daycare/days">
            Ver mis días
            <ArrowRight />
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={onReserveMore}
        >
          Reservar más días
        </Button>
      </div>
    </div>
  );
}
