import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  PawPrint,
  Pencil,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrors } from "@/components/shared/FormErrors";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import {
  FollowUpSuggestions,
  type FollowUpSuggestion,
} from "@/features/booking/components/FollowUpSuggestions";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/features/booking/components/PaymentSection";
import { StripeInlineError } from "@/features/booking/components/payment-section-errors";
import { CoverageCard } from "@/features/booking/components/CoverageCard";
import { stripeEnabled } from "@/features/payments/stripe-enabled";
import { useCoverage } from "@/api/hooks/use-memberships";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatMoney } from "@/features/orders/lib/format-money";
import {
  selectBookingAddonsSubtotal,
  useBookingFlowStore,
} from "@/stores/booking-flow-store";
import type {
  BookingLocationSnapshot,
  BookingServiceSnapshot,
  BookingSlotSnapshot,
  BookingPetSnapshot,
} from "@/stores/booking-flow-store";
import {
  useAvailabilityForPets,
  useCreateAppointment,
} from "@/api/hooks/use-appointments";
import { usePets } from "@/api/hooks/use-pets";
import { useGroomingQuote } from "@/api/hooks/use-services";
import { formatLongDate, formatTime, toLocalDateISO } from "@/lib/format-date";
import type { BusinessUnitCode } from "@/types/business-unit";
import type { AvailabilityStart } from "@/types/appointment";

// Search window around the just-booked slot for follow-up suggestions.
// Looking before the booking too matters: with sparse slot grids the next
// available slot AFTER could be hours away while the slot right BEFORE is
// just 30 min off — much more useful for chaining a multi-pet visit.
const FOLLOWUP_WINDOW_BEFORE_HOURS = 4;
const FOLLOWUP_WINDOW_AFTER_HOURS = 8;

interface BookingSnapshot {
  businessUnitCode: BusinessUnitCode | null;
  location: BookingLocationSnapshot;
  service: BookingServiceSnapshot;
  slot: BookingSlotSnapshot;
  pet: BookingPetSnapshot;
}

/** 400 `{"scheduled_start": "Ese horario ya no está disponible…"}` —
 *  alguien más tomó el carril entre que se eligió y se confirmó. */
function extractSlotTakenError(err: unknown): string | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) return null;
  const data = err.response.data as
    | Record<string, string[] | string | undefined>
    | undefined;
  const val = data && typeof data === "object" ? data.scheduled_start : undefined;
  if (!val) return null;
  return Array.isArray(val) ? String(val[0]) : String(val);
}

function slotMinutes(slot: { start: string; end: string }): number {
  return Math.round(
    (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60_000,
  );
}

/** Carril (recurso/staff) de un inicio — dos sugerencias en el mismo
 *  carril no se pueden encimar. */
function laneKey(s: AvailabilityStart): string {
  return `${s.resource ?? ""}|${s.staff_user ?? ""}`;
}

function extractApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "No pudimos crear la cita. Intenta de nuevo.";
  }
  const data = err.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, string[] | string | undefined>;
    // Prefer known "summary" keys first
    for (const key of ["detail", "non_field_errors", "error"]) {
      const val = record[key];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
    const firstKey = Object.keys(record)[0];
    if (firstKey) {
      const val = record[firstKey];
      if (val) return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return "No pudimos crear la cita. Intenta de nuevo.";
}

export function BookingReviewPage() {
  const navigate = useNavigate();
  const state = useBookingFlowStore();
  const reset = useBookingFlowStore((s) => s.reset);
  const setNotes = useBookingFlowStore((s) => s.setNotes);
  const clearSlot = useBookingFlowStore((s) => s.clearSlot);
  const addons = useBookingFlowStore((s) => s.addons);
  const addonsSubtotal = useBookingFlowStore(selectBookingAddonsSubtotal);
  const create = useCreateAppointment();

  // Imperative handle to the PaymentSection so this page can call
  // confirm() on the same "Confirmar reserva" button click — keeps
  // the UX as a single action even though the underlying flow is
  // two-step (Stripe SetupIntent confirm → booking POST).
  const paymentRef = useRef<PaymentSectionHandle | null>(null);
  const paymentEnabled = stripeEnabled();

  const [error, setError] = useState<string | null>(null);
  // Coverage check fires as soon as the wizard reaches this step. If
  // the customer has an active membership balance for the chosen
  // service, we show the CoverageCard with the opt-out toggle (defaults
  // to ON — use the benefit). When `useEntitlementChoice` is null, the
  // toggle hasn't been touched yet and we derive the effective value
  // from coverage.covered. Touching the toggle flips it to a sticky
  // explicit choice that survives until the user navigates away.
  const coverage = useCoverage(state.service?.id ?? null);
  const [useEntitlementChoice, setUseEntitlementChoice] =
    useState<boolean | null>(null);
  const coverageAvailable = !!coverage.data?.covered;
  const useEntitlement =
    useEntitlementChoice ?? coverageAvailable;
  // Snapshot of the just-booked appointment. Captured the first time the
  // success branch fires so we can clear the wizard store immediately —
  // otherwise tapping the "Reservar" tab from the nav while on the success
  // screen would cascade through BookingLandingPage and dump the user on a
  // stale review for the appointment they JUST confirmed.
  const [snapshot, setSnapshot] = useState<BookingSnapshot | null>(null);
  // Pets the user has booked in this success-screen chain. Without tracking
  // this, the second iteration would happily suggest the first-iteration's
  // pet again — same pet booked twice in a row makes no sense.
  const [bookedInSession, setBookedInSession] = useState<Set<string>>(
    () => new Set(),
  );
  // Locks the success-screen render while a bulk booking loop is in flight.
  // The underlying mutation cycles its isPending/isSuccess flags between
  // POSTs, so without this latch the page would flicker back to the
  // regular review pane mid-loop.
  const [isBulkBooking, setIsBulkBooking] = useState(false);

  const { data: petsData } = usePets();

  const isMatrix = state.service?.pricingMode === "SIZE_COAT_MATRIX";
  const { data: reviewQuote } = useGroomingQuote(
    isMatrix && state.service && state.pet
      ? { service: state.service.id, pet: state.pet.id }
      : null,
  );

  // Other active pets the customer owns minus any they've already booked
  // in this success-screen chain (the just-booked one plus prior picks).
  const otherPets = useMemo(() => {
    if (!petsData || !snapshot) return [];
    return petsData.results.filter(
      (p) =>
        p.is_active &&
        p.id !== snapshot.pet.id &&
        !bookedInSession.has(p.id),
    );
  }, [petsData, snapshot, bookedInSession]);

  // Sugerencias en una ventana ALREDEDOR del horario recién reservado
  // (antes y después) — con huecos dispersos, 30 min antes puede estar
  // más cerca que el siguiente libre 2h después. La disponibilidad se
  // pide por mascota: con calculadora de tamaño/pelo cada una tiene su
  // propia duración. Availability ya excluye lo recién reservado.
  const justBookedStart = snapshot?.slot.start ?? null;
  const justBookedEnd = snapshot?.slot.end ?? null;
  const followUpEnabled =
    !!snapshot && otherPets.length > 0 && !!justBookedStart;
  const followUpQueries = useAvailabilityForPets(
    followUpEnabled
      ? {
          service: snapshot!.service.id,
          date: toLocalDateISO(new Date(justBookedStart!)),
        }
      : null,
    followUpEnabled ? otherPets.map((p) => p.id) : [],
  );
  const slotsLoading = followUpQueries.some((q) => q.isLoading);

  // Empareja cada mascota restante con el inicio más cercano al recién
  // reservado ("13:30" gana a "16:00" si se reservó a las 14:00); empate
  // → el posterior ("ya que estás aquí"). Mascotas cuya disponibilidad
  // falla (p. ej. sin peso/pelo) simplemente no se sugieren.
  const suggestions: FollowUpSuggestion[] = useMemo(() => {
    if (!followUpEnabled || !justBookedStart || !justBookedEnd) return [];
    const bookedT = new Date(justBookedStart).getTime();
    const windowStart = bookedT - FOLLOWUP_WINDOW_BEFORE_HOURS * 3_600_000;
    const windowEnd =
      new Date(justBookedEnd).getTime() +
      FOLLOWUP_WINDOW_AFTER_HOURS * 3_600_000;
    const taken: AvailabilityStart[] = [];
    const result: FollowUpSuggestion[] = [];
    otherPets.forEach((pet, i) => {
      const starts = followUpQueries[i]?.data?.starts ?? [];
      const candidates = starts
        .filter((s) => {
          const t = new Date(s.start).getTime();
          return t >= windowStart && t <= windowEnd;
        })
        .sort((a, b) => {
          const aT = new Date(a.start).getTime();
          const bT = new Date(b.start).getTime();
          const aDist = Math.abs(aT - bookedT);
          const bDist = Math.abs(bT - bookedT);
          if (aDist !== bDist) return aDist - bDist;
          return bT - aT;
        });
      const pick = candidates.find(
        (c) =>
          !taken.some(
            (t) =>
              laneKey(t) === laneKey(c) &&
              new Date(c.start) < new Date(t.end) &&
              new Date(t.start) < new Date(c.end),
          ),
      );
      if (pick) {
        taken.push(pick);
        result.push({ pet, slot: pick });
      }
    });
    return result;
  }, [followUpEnabled, followUpQueries, otherPets, justBookedStart, justBookedEnd]);

  // No follow-up to show → keep the legacy "auto-navigate after a beat"
  // so the user isn't stuck. Hold off until snapshot is captured AND the
  // slot query (if any) has resolved — otherwise we'd race the suggestions
  // and navigate away before they had a chance to render.
  const hasFollowUp = suggestions.length > 0;
  const suggestionsReady =
    !!snapshot && (!followUpEnabled || !slotsLoading);
  useEffect(() => {
    if (!create.isSuccess) return;
    if (!suggestionsReady) return;
    if (hasFollowUp) return;
    const t = setTimeout(() => {
      navigate("/my/appointments", { replace: true });
    }, 2800);
    return () => clearTimeout(t);
  }, [create.isSuccess, suggestionsReady, hasFollowUp, navigate]);

  // Bulk-book every remaining suggestion in one click. Stops on the first
  // failure so the user can see what went wrong; successfully-booked pets
  // stay booked and get added to `bookedInSession` so the re-rendered
  // suggestion list excludes them. `isBulkBooking` keeps the success
  // branch latched in while POSTs cycle the mutation flags.
  async function handlePickAll(items: FollowUpSuggestion[]) {
    if (!snapshot) return;
    setIsBulkBooking(true);
    setError(null);
    for (const s of items) {
      try {
        await create.mutateAsync({
          business_unit: snapshot.location.businessUnitId,
          pet: s.pet.id,
          // Sin scheduled_end: el backend calcula start + duración
          // real de esta mascota.
          scheduled_start: s.slot.start,
          channel: "web",
          items: [
            {
              service: snapshot.service.id,
              resource: s.slot.resource ?? undefined,
              slot_id: s.slot.slot_id,
            },
          ],
        });
        setBookedInSession((prev) => {
          if (prev.has(s.pet.id)) return prev;
          const next = new Set(prev);
          next.add(s.pet.id);
          return next;
        });
      } catch (err) {
        setIsBulkBooking(false);
        setError(extractApiError(err));
        return;
      }
    }
    setIsBulkBooking(false);
    navigate("/my/appointments", { replace: true });
  }

  if ((create.isSuccess || isBulkBooking) && snapshot) {
    return (
      <SuccessScreen
        suggestions={suggestions}
        serviceName={snapshot.service.name}
        servicePriceLabel={
          // Con calculadora cada mascota tiene su propio precio — el
          // del snapshot es el de la mascota recién reservada.
          snapshot.service.pricingMode === "SIZE_COAT_MATRIX"
            ? null
            : formatPriceLabel(snapshot.service.price)
        }
        error={error}
        isBulkBooking={isBulkBooking}
        onPickSuggestion={(s) => {
          // Re-seed the wizard atomically with the snapshot's BU/location/
          // service plus the new pet+slot pair. setState (rather than the
          // individual setBusinessUnit/setLocation/setService actions)
          // avoids those actions' "wipe everything downstream" semantics.
          useBookingFlowStore.setState({
            businessUnitCode: snapshot.businessUnitCode,
            location: snapshot.location,
            service: snapshot.service,
            slot: {
              slotId: s.slot.slot_id,
              start: s.slot.start,
              end: s.slot.end,
              resource: s.slot.resource,
            },
            pet: { id: s.pet.id, name: s.pet.name },
            notes: "",
          });
          create.reset();
          setSnapshot(null);
          setError(null);
        }}
        onPickAll={handlePickAll}
        onDone={() => navigate("/my/appointments", { replace: true })}
      />
    );
  }

  if (!state.location) return <Navigate to="/book/location" replace />;
  if (!state.service) return <Navigate to="/book/service" replace />;
  if (!state.pet) return <Navigate to="/book/pet" replace />;
  if (!state.slot) return <Navigate to="/book/slot" replace />;

  // Precio: con calculadora, el de la cotización de ESTA mascota (puede
  // venir de una sugerencia post-reserva con otra mascota); duración:
  // la del horario elegido en availability (start → end real).
  const price = Number(
    isMatrix && reviewQuote ? reviewQuote.price : state.service.price,
  );
  const durationMinutes = slotMinutes(state.slot);
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("es-MX")}`
      : null;

  async function handleConfirm() {
    if (!state.service || !state.location || !state.slot || !state.pet) return;

    // Capture the values we'll need on the success screen BEFORE the
    // mutation runs — `reset()` after the await wipes the store and the
    // closure values are what we hand to the snapshot.
    const justBooked: BookingSnapshot = {
      businessUnitCode: state.businessUnitCode,
      location: state.location,
      service: state.service,
      slot: state.slot,
      pet: state.pet,
    };

    setError(null);
    // Confirm the SetupIntent first when Stripe is configured. The
    // PaymentSection child exposes confirm() via ref; on success we
    // get a PaymentMethod id to send with the booking. When Stripe
    // isn't configured (dev env without the publishable key), skip
    // and let the booking go through unpaid — useful for local dev.
    let paymentMethodId: string | undefined;
    if (paymentEnabled) {
      try {
        paymentMethodId = await paymentRef.current?.confirm();
      } catch (err) {
        // Stripe-rendered validation errors (CVC, decline, missing
        // fields) already appear inside the Element iframe — don't
        // duplicate them in our banner.
        if (err instanceof StripeInlineError) return;
        setError(err instanceof Error ? err.message : "Error al confirmar la tarjeta.");
        return;
      }
    }

    try {
      await create.mutateAsync({
        business_unit: state.location.businessUnitId,
        pet: state.pet.id,
        // Sin scheduled_end: el backend calcula start + duración real.
        scheduled_start: state.slot.start,
        channel: "web",
        notes: state.notes || undefined,
        items: [
          {
            service: state.service.id,
            resource: state.slot.resource ?? undefined,
            slot_id: state.slot.slotId,
            // Only forward an explicit value when coverage is even
            // available — otherwise let the backend's auto-detect
            // path run (which will resolve to false anyway, but
            // keeps the contract honest).
            ...(coverageAvailable
              ? { use_entitlement: useEntitlement }
              : {}),
            // F-G extras-at-check-in: GroomingExtra ids pre-
            // seleccionados en el paso opcional de opciones de
            // grooming. Vacío cuando el paso se auto-adelantó o el
            // cliente no eligió nada — el backend acepta [] tal
            // cual los add-ons.
            extras: state.groomingExtras.map((e) => e.id),
          },
        ],
        // F4-D: add-ons picked in the optional wizard step. Empty
        // array is fine — the serializer defaults to [] when omitted
        // so the same shape works whether the customer added any.
        products: addons.map((a) => ({
          product_id: a.productId,
          quantity: a.quantity,
        })),
        stripe_payment_method_id: paymentMethodId,
      });
      // Event-driven (vs. derived in an effect): record the snapshot,
      // add the pet to the booked-in-session set, and clear the wizard
      // store so the nav doesn't fast-forward into a stale review on
      // its next visit.
      setSnapshot(justBooked);
      setBookedInSession((prev) => {
        if (prev.has(justBooked.pet.id)) return prev;
        const next = new Set(prev);
        next.add(justBooked.pet.id);
        return next;
      });
      reset();
    } catch (err) {
      const slotTaken = extractSlotTakenError(err);
      if (slotTaken) {
        // Alguien más tomó el horario — de vuelta a elegir otro.
        toast.error(slotTaken);
        clearSlot();
        navigate("/book/slot");
        return;
      }
      setError(extractApiError(err));
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="review"
        backTo="/book/addons"
        title="Revisa tu reserva"
        description="Confirma que todo esté bien antes de agendar."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.service.name}</p>
              <p className="text-xs text-muted-foreground">
                {durationMinutes} min
                {priceLabel && ` · ${priceLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize">
                {formatLongDate(state.slot.start)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(state.slot.start)} – {formatTime(state.slot.end)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.location.name}</p>
              <p className="text-xs text-muted-foreground">
                {state.location.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{state.pet.name}</p>
              {state.businessUnitCode === "FOTO" && (
                <p className="text-xs text-muted-foreground">
                  Si vienen más perritos, este es el principal — los demás
                  pueden acompañar.
                </p>
              )}
            </div>
          </div>

          {addons.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Extras</p>
                    <Link
                      to="/book/addons"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Link>
                  </div>
                  <ul className="space-y-1.5">
                    {addons.map((a) => (
                      <li
                        key={a.productId}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded bg-muted">
                          <ImageWithFallback
                            src={a.photo}
                            alt={a.name}
                            className="h-full w-full object-cover"
                            fallbackClassName="h-full w-full"
                            fallback={
                              <Package className="h-3 w-3 text-muted-foreground" />
                            }
                          />
                        </div>
                        <span className="min-w-0 flex-1 truncate">
                          {a.name}{" "}
                          <span className="text-muted-foreground">
                            × {a.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatMoney(Number(a.price) * a.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pt-0.5 text-xs text-muted-foreground">
                    Subtotal extras (IVA incl.):{" "}
                    <span className="font-medium">
                      {formatMoney(addonsSubtotal)}
                    </span>
                    {" · "}
                    Se cobra junto con la cita al completarla.
                  </p>
                </div>
              </div>
            </>
          )}

          {state.groomingExtras.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="flex items-start gap-3">
                <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Opciones de grooming</p>
                    <Link
                      to="/book/grooming-extras"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Link>
                  </div>
                  <ul className="space-y-1.5">
                    {state.groomingExtras.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate">{e.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {e.isFixedPrice
                            ? `$${e.priceMin}`
                            : `$${e.priceMin}–$${e.priceMax}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pt-0.5 text-xs text-muted-foreground">
                    Los de precio variable se confirman con el tamaño real
                    en recepción. Se cobran junto con la cita al
                    completarla.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Label htmlFor="notes" className="sr-only">
            Notas
          </Label>
          <Textarea
            id="notes"
            placeholder="¿Algo que el equipo deba saber? (opcional)"
            rows={3}
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </CardContent>
      </Card>

      {coverageAvailable && coverage.data && (
        <CoverageCard
          planName={coverage.data.plan_name ?? "tu membresía"}
          remaining={coverage.data.remaining}
          total={coverage.data.total}
          use={useEntitlement}
          onToggle={setUseEntitlementChoice}
        />
      )}

      {paymentEnabled && (
        <div className="space-y-2">
          <PaymentSection ref={paymentRef} />
          {useEntitlement && coverageAvailable && (
            // The card stays on file as the penalty safety net even
            // when the cita itself is membership-covered. Make that
            // explicit so the customer doesn't wonder why we're
            // still asking for a card.
            <p className="px-1 text-xs text-muted-foreground">
              Tu tarjeta sólo se usaría si cancelas tarde o no te
              presentas — la cita normal no genera cobro.
            </p>
          )}
        </div>
      )}

      <FormErrors message={error ?? undefined} />

      <Button
        variant="brand"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={create.isPending}
      >
        {create.isPending ? "Agendando…" : "Confirmar reserva"}
      </Button>
    </div>
  );
}

function formatPriceLabel(price: string | undefined): string | null {
  if (!price) return null;
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("es-MX")}` : null;
}

interface SuccessScreenProps {
  suggestions: FollowUpSuggestion[];
  serviceName: string;
  servicePriceLabel: string | null;
  error: string | null;
  isBulkBooking: boolean;
  onPickSuggestion: (s: FollowUpSuggestion) => void;
  onPickAll: (suggestions: FollowUpSuggestion[]) => void;
  onDone: () => void;
}

function SuccessScreen({
  suggestions,
  serviceName,
  servicePriceLabel,
  error,
  isBulkBooking,
  onPickSuggestion,
  onPickAll,
  onDone,
}: SuccessScreenProps) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-8"
      role="status"
      aria-live="polite"
    >
      <SuccessCheckmark />

      <div className="text-center">
        <h2 className="text-2xl font-semibold">¡Listo!</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Tu cita quedó agendada. Te esperamos.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="w-full max-w-sm">
          <FollowUpSuggestions
            suggestions={suggestions}
            serviceName={serviceName}
            servicePriceLabel={servicePriceLabel}
            onPick={onPickSuggestion}
            onPickAll={onPickAll}
            isBookingAll={isBulkBooking}
          />
        </div>
      )}

      {error && (
        <div className="w-full max-w-sm">
          <FormErrors message={error} />
        </div>
      )}

      <Button
        variant={suggestions.length > 0 ? "outline" : "default"}
        onClick={onDone}
        disabled={isBulkBooking}
      >
        Ver mis citas
      </Button>
    </div>
  );
}
