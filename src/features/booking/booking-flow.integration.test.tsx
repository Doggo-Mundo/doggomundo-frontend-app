import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { server } from "@/test/msw-server";
import { makePet, makePetListItem } from "@/test/fixtures";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { makeTestQueryClient } from "@/test/test-utils";

const API = "http://localhost/api";

// Lazy-import the booking pages so their internal `import "..."` chains resolve
// the same way they do in the real router.
const BookingLandingPage = lazy(() =>
  import("./pages/BookingLandingPage").then((m) => ({
    default: m.BookingLandingPage,
  })),
);
const BusinessUnitPickerPage = lazy(() =>
  import("./pages/BusinessUnitPickerPage").then((m) => ({
    default: m.BusinessUnitPickerPage,
  })),
);
const LocationPickerPage = lazy(() =>
  import("./pages/LocationPickerPage").then((m) => ({
    default: m.LocationPickerPage,
  })),
);
const ServicePickerPage = lazy(() =>
  import("./pages/ServicePickerPage").then((m) => ({
    default: m.ServicePickerPage,
  })),
);
const SlotPickerPage = lazy(() =>
  import("./pages/SlotPickerPage").then((m) => ({
    default: m.SlotPickerPage,
  })),
);
const PetPickerPage = lazy(() =>
  import("./pages/PetPickerPage").then((m) => ({
    default: m.PetPickerPage,
  })),
);
const GroomingExtrasPickerPage = lazy(() =>
  import("./pages/GroomingExtrasPickerPage").then((m) => ({
    default: m.GroomingExtrasPickerPage,
  })),
);
const AddOnsPickerPage = lazy(() =>
  import("./pages/AddOnsPickerPage").then((m) => ({
    default: m.AddOnsPickerPage,
  })),
);
const BookingReviewPage = lazy(() =>
  import("./pages/BookingReviewPage").then((m) => ({
    default: m.BookingReviewPage,
  })),
);

function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

// Grooming menu for bu-grooming: "Baño y corte" (= srv-matrix) includes
// the whole "Baño" package plus its own features.
const GROOMING_MENU = {
  business_unit: { id: "bu-grooming", name: "Grooming Polanco" },
  size_tiers: [],
  packages: [
    {
      id: "srv-bano",
      name: "Baño",
      description: "",
      sort_order: 0,
      tagline: "Limpio y perfumado",
      includes_service: null,
      features: [
        { id: "f-1", title: "Baño con shampoo", description: "", on_request: false, sort_order: 0 },
        { id: "f-2", title: "Secado", description: "", on_request: false, sort_order: 1 },
      ],
      prices: [
        { id: "p-1", size_tier: "t-1", coat_type: "SHORT", price: "280.00", duration_minutes: 45 },
      ],
    },
    {
      id: "srv-matrix",
      name: "Baño y corte",
      description: "",
      sort_order: 1,
      tagline: "El look completo",
      includes_service: { id: "srv-bano", name: "Baño" },
      features: [
        { id: "f-3", title: "Corte de raza", description: "", on_request: false, sort_order: 0 },
        { id: "f-4", title: "Corte de uñas", description: "", on_request: true, sort_order: 1 },
      ],
      prices: [
        { id: "p-2", size_tier: "t-1", coat_type: "SHORT", price: "350.00", duration_minutes: 45 },
        { id: "p-3", size_tier: "t-2", coat_type: "LONG", price: "780.50", duration_minutes: 180 },
      ],
    },
  ],
  deluxe: { price_from: "50.00", features: [], prices: [] },
  extras: [],
};

const POLANCO_LOCATIONS = paginated([
  {
    id: "loc-1",
    name: "Sucursal Polanco",
    address: "Av. Polanco 1",
    email: "polanco@doggo.mx",
    phone: "+5215512345678",
    maps_url: "",
    business_units: [
      {
        id: "bu-grooming",
        name: "Grooming Polanco",
        code: "GROOMING",
        code_display: "Grooming",
      },
    ],
  },
]);

const MATRIX_SERVICE = {
  id: "srv-matrix",
  name: "Baño y corte",
  description: "",
  business_unit: "bu-grooming",
  business_unit_name: "Grooming Polanco",
  business_unit_code: "GROOMING",
  base_duration_minutes: 60,
  base_price: "400.00",
  requires_pet: true,
  capacity_type: "staff_based",
  capacity_type_display: "Por staff",
  pricing_mode: "SIZE_COAT_MATRIX",
  pricing_mode_display: "Matriz tamaño/pelo",
  sort_order: 0,
};

const QUOTE_OK = {
  service: "srv-matrix",
  size_tier: { id: "tier-1", name: "Chico" },
  coat_type: "SHORT",
  coat_type_display: "Corto",
  price: "350.00",
  duration_minutes: 45,
  deluxe_price: null,
  total: "350.00",
  extras: [
    {
      id: "extra-1",
      name: "Perfume",
      price_min: "80.00",
      price_max: "80.00",
      is_fixed_price: true,
    },
  ],
};

function seedMatrixFlow(overrides: Partial<ReturnType<typeof useBookingFlowStore.getState>> = {}) {
  useBookingFlowStore.setState({
    businessUnitCode: "GROOMING",
    location: {
      id: "loc-1",
      name: "Sucursal Polanco",
      address: "Polanco",
      businessUnitId: "bu-grooming",
      businessUnitName: "Grooming Polanco",
    },
    service: {
      id: "srv-matrix",
      name: "Baño y corte",
      price: "400.00",
      durationMinutes: 60,
      requiresPet: true,
      pricingMode: "SIZE_COAT_MATRIX",
    },
    slot: null,
    pet: null,
    notes: "",
    ...overrides,
  });
}

function renderWizard(initial = "/book") {
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <Suspense fallback={<div>loading</div>}>
          <Routes>
            <Route path="/book" element={<BookingLandingPage />} />
            <Route
              path="/book/business-unit"
              element={<BusinessUnitPickerPage />}
            />
            <Route path="/book/location" element={<LocationPickerPage />} />
            <Route path="/book/service" element={<ServicePickerPage />} />
            <Route path="/book/slot" element={<SlotPickerPage />} />
            <Route path="/book/pet" element={<PetPickerPage />} />
            <Route
              path="/book/grooming-extras"
              element={<GroomingExtrasPickerPage />}
            />
            <Route path="/book/addons" element={<AddOnsPickerPage />} />
            <Route path="/book/review" element={<BookingReviewPage />} />
            <Route
              path="/my/appointments"
              element={<div data-testid="appointments">Mis citas</div>}
            />
            <Route
              path="/pets/new"
              element={<div data-testid="pets-new">Alta mascota</div>}
            />
          </Routes>
        </Suspense>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Booking wizard — happy path", () => {
  beforeEach(() => {
    useBookingFlowStore.getState().reset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Pin to a fixed morning so the DateStrip renders a known "today" and
    // the slot query window is deterministic.
    vi.setSystemTime(new Date("2030-06-01T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    useBookingFlowStore.getState().reset();
  });

  it("walks through BU → (auto-skip Location) → Service → Pet → Slot → Review and POSTs the nested payload", { timeout: 20000 }, async () => {
    let postedPayload: Record<string, unknown> | null = null;
    let availabilityParams: Record<string, string> | null = null;

    server.use(
      // Location picker
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(
          paginated([
            {
              id: "loc-1",
              name: "Sucursal Polanco",
              address: "Av. Polanco 1",
              email: "polanco@doggo.mx",
              phone: "+5215512345678",
              maps_url: "",
              business_units: [
                {
                  id: "bu-grooming",
                  name: "Grooming Polanco",
                  code: "GROOMING",
                  code_display: "Grooming",
                },
              ],
            },
          ]),
        ),
      ),
      // Service picker (filters by business_unit)
      http.get(`${API}/services/catalog/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("business_unit")).toBe("bu-grooming");
        return HttpResponse.json(
          paginated([
            {
              id: "srv-corte",
              name: "Corte completo",
              description: "",
              business_unit: "bu-grooming",
              business_unit_name: "Grooming Polanco",
              business_unit_code: "GROOMING",
              base_duration_minutes: 60,
              base_price: "450.00",
              requires_pet: true,
              capacity_type: "staff_based",
              capacity_type_display: "Por staff",
              pricing_mode: "FLAT",
              pricing_mode_display: "Plano",
              sort_order: 0,
            },
          ]),
        );
      }),
      // Slot picker — availability by local CDMX day + service + pet
      http.get(`${API}/appointments/availability/`, ({ request }) => {
        const url = new URL(request.url);
        availabilityParams = Object.fromEntries(url.searchParams);
        return HttpResponse.json({
          service: "srv-corte",
          date: "2030-06-01",
          duration_minutes: 60,
          starts: [
            {
              start: "2030-06-01T16:00:00Z",
              end: "2030-06-01T17:00:00Z",
              slot_id: "slot-1",
              resource: "res-1",
              staff_user: null,
            },
          ],
        });
      }),
      // Pet picker
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([
            makePetListItem({
              id: "pet-1",
              name: "Nala",
              onboarding_completion_percentage: 100,
            }),
          ]),
        ),
      ),
      // Add-ons picker (F4-D) — empty catalog triggers the page's
      // auto-forward to /book/review so this happy-path test doesn't
      // need to interact with the extras step.
      http.get(`${API}/retail/products/`, () => HttpResponse.json([])),
      // Create
      http.post(`${API}/appointments/`, async ({ request }) => {
        postedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: "appt-new",
            business_unit: "bu-grooming",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-06-01T16:00:00Z",
            scheduled_end: "2030-06-01T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-06-01T10:00:00Z",
            updated_at: "2030-06-01T10:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/business-unit");

    // Step 1: business unit
    await user.click(
      await screen.findByRole("button", { name: /grooming profesional/i }),
    );

    // Step 2 (location) is auto-skipped because the system has exactly
    // one sucursal — the wizard lands directly on the service picker.

    // Step 3: service
    await user.click(
      await screen.findByRole("button", { name: /corte completo/i }),
    );

    // Step 4: pet — F-G.4 moved this before slot, so the real
    // duration/price are known before horarios are shown.
    await user.click(await screen.findByRole("button", { name: /nala/i }));

    // Step 5: slot — the start is UTC 16:00 which renders as MX local
    // 10:00. The chip also shows the approximate end ("termina 11:00").
    expect(await screen.findByText(/duración aprox\. 60 min/i)).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: /10:00\s*termina 11:00/ }),
    );
    expect(availabilityParams).toEqual({
      service: "srv-corte",
      date: "2030-06-01",
      pet: "pet-1",
    });
    expect(useBookingFlowStore.getState().slot).toEqual({
      slotId: "slot-1",
      start: "2030-06-01T16:00:00Z",
      end: "2030-06-01T17:00:00Z",
      resource: "res-1",
    });

    // Step 6: review → confirm
    await user.click(
      await screen.findByRole("button", { name: /confirmar reserva/i }),
    );

    // Success swaps in an animation that auto-navigates after ~2.8s.
    await waitFor(
      () => expect(screen.getByTestId("appointments")).toBeInTheDocument(),
      { timeout: 5000 },
    );

    expect(postedPayload).toMatchObject({
      business_unit: "bu-grooming",
      pet: "pet-1",
      scheduled_start: "2030-06-01T16:00:00Z",
      channel: "web",
      items: [{ service: "srv-corte", resource: "res-1", slot_id: "slot-1" }],
    });
    // The server computes the end from the real duration.
    expect(postedPayload).not.toHaveProperty("scheduled_end");
  });

  it("walks a matrix-priced service through the grooming-extras step and forwards selected ids", { timeout: 20000 }, async () => {
    let postedPayload: Record<string, unknown> | null = null;

    server.use(
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(
          paginated([
            {
              id: "loc-1",
              name: "Sucursal Polanco",
              address: "Av. Polanco 1",
              email: "polanco@doggo.mx",
              phone: "+5215512345678",
              maps_url: "",
              business_units: [
                {
                  id: "bu-grooming",
                  name: "Grooming Polanco",
                  code: "GROOMING",
                  code_display: "Grooming",
                },
              ],
            },
          ]),
        ),
      ),
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(
          paginated([
            {
              id: "srv-matrix",
              name: "Baño y corte",
              description: "",
              business_unit: "bu-grooming",
              business_unit_name: "Grooming Polanco",
              business_unit_code: "GROOMING",
              base_duration_minutes: 60,
              base_price: "400.00",
              requires_pet: true,
              capacity_type: "staff_based",
              capacity_type_display: "Por staff",
              pricing_mode: "SIZE_COAT_MATRIX",
              pricing_mode_display: "Matriz tamaño/pelo",
              sort_order: 0,
            },
          ]),
        ),
      ),
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([
            makePetListItem({
              id: "pet-1",
              name: "Nala",
              onboarding_completion_percentage: 100,
            }),
          ]),
        ),
      ),
      http.get(`${API}/services/grooming/quote/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("service")).toBe("srv-matrix");
        expect(url.searchParams.get("pet")).toBe("pet-1");
        return HttpResponse.json({
          service: "srv-matrix",
          size_tier: { id: "tier-1", name: "Chico" },
          coat_type: "SHORT",
          coat_type_display: "Corto",
          price: "350.00",
          duration_minutes: 45,
          deluxe_price: null,
          total: "350.00",
          extras: [
            {
              id: "extra-1",
              name: "Perfume",
              price_min: "80.00",
              price_max: "80.00",
              is_fixed_price: true,
            },
          ],
        });
      }),
      http.get(`${API}/services/grooming/menu/`, () =>
        HttpResponse.json(GROOMING_MENU),
      ),
      http.get(`${API}/appointments/availability/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("service")).toBe("srv-matrix");
        expect(url.searchParams.get("pet")).toBe("pet-1");
        return HttpResponse.json({
          service: "srv-matrix",
          date: "2030-06-01",
          duration_minutes: 45,
          starts: [
            {
              start: "2030-06-01T16:00:00Z",
              end: "2030-06-01T16:45:00Z",
              slot_id: "slot-1",
              resource: "res-1",
              staff_user: null,
            },
          ],
        });
      }),
      http.get(`${API}/retail/products/`, () => HttpResponse.json([])),
      http.post(`${API}/appointments/`, async ({ request }) => {
        postedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: "appt-new-2",
            business_unit: "bu-grooming",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-06-01T16:00:00Z",
            scheduled_end: "2030-06-01T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-06-01T10:00:00Z",
            updated_at: "2030-06-01T10:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/business-unit");

    await user.click(
      await screen.findByRole("button", { name: /grooming profesional/i }),
    );
    await user.click(
      await screen.findByRole("button", { name: /baño y corte/i }),
    );
    await user.click(await screen.findByRole("button", { name: /nala/i }));

    // Lands on the grooming-extras step — select the one extra offered.
    await user.click(await screen.findByRole("button", { name: /perfume/i }));
    await user.click(
      await screen.findByRole("button", { name: /continuar con 1 opción/i }),
    );

    // Slot step — the matrix quote resolved to 45 min, start 16:00 UTC = 10:00 MX.
    await user.click(await screen.findByRole("button", { name: /10:00/ }));

    await user.click(
      await screen.findByRole("button", { name: /confirmar reserva/i }),
    );

    await waitFor(
      () => expect(screen.getByTestId("appointments")).toBeInTheDocument(),
      { timeout: 5000 },
    );

    expect(postedPayload).toMatchObject({
      business_unit: "bu-grooming",
      pet: "pet-1",
      scheduled_start: "2030-06-01T16:00:00Z",
      items: [
        {
          service: "srv-matrix",
          slot_id: "slot-1",
          resource: "res-1",
          extras: ["extra-1"],
        },
      ],
    });
    expect(postedPayload).not.toHaveProperty("scheduled_end");
  });

  it("shows the empty-pets state on the pet step instead of a dead end", async () => {
    // F-G.4: pet now comes before slot, so a customer with zero pets
    // hits this directly on the pet step — PetPickerPage's own
    // EmptyState (with an "Agregar Doggo" CTA) handles it; there's
    // no more auto-redirect buried in the slot step.
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
    );

    useBookingFlowStore.setState({
      businessUnitCode: "GROOMING",
      location: {
        id: "loc-1",
        name: "Sucursal Polanco",
        address: "Polanco",
        businessUnitId: "bu-grooming",
        businessUnitName: "Grooming Polanco",
      },
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
        pricingMode: "FLAT",
      },
      slot: null,
      pet: null,
      notes: "",
    });

    renderWizard("/book/pet");

    expect(
      await screen.findByText(/primero necesitas registrar un doggo/i),
    ).toBeInTheDocument();
  });

  it("redirects back to the pet step if slot is reached without a pet chosen", async () => {
    // Guards against deep-linking or a stale/edited store state — the
    // new order requires pet before slot, so slot must bounce back
    // instead of rendering with an undefined pet.
    useBookingFlowStore.setState({
      businessUnitCode: "GROOMING",
      location: {
        id: "loc-1",
        name: "Sucursal Polanco",
        address: "Polanco",
        businessUnitId: "bu-grooming",
        businessUnitName: "Grooming Polanco",
      },
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
        pricingMode: "FLAT",
      },
      slot: null,
      pet: null,
      notes: "",
    });

    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ id: "pet-1", name: "Nala" })])),
      ),
    );

    renderWizard("/book/slot");

    expect(
      await screen.findByRole("heading", { name: /para cuál de tus doggos/i }),
    ).toBeInTheDocument();
  });
});

describe("Booking wizard — grooming windows", () => {
  beforeEach(() => {
    useBookingFlowStore.getState().reset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2030-06-01T10:00:00Z"));
    server.use(
      http.get(`${API}/locations/`, () => HttpResponse.json(POLANCO_LOCATIONS)),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    useBookingFlowStore.getState().reset();
  });

  it("shows what each matrix package includes on the service step", async () => {
    seedMatrixFlow();
    server.use(
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(paginated([MATRIX_SERVICE])),
      ),
      http.get(`${API}/services/grooming/menu/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("business_unit")).toBe("bu-grooming");
        return HttpResponse.json(GROOMING_MENU);
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/service");

    expect(await screen.findByText("El look completo")).toBeInTheDocument();
    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(screen.getByText("$350")).toBeInTheDocument();
    expect(screen.getByText("45–180 min")).toBeInTheDocument();
    // includes_service → "Todo el Baño" + chips with Baño's features,
    // then "Y además:" + its own features (on_request marked).
    expect(screen.getByText("Todo el Baño")).toBeInTheDocument();
    expect(screen.getByText("Baño con shampoo")).toBeInTheDocument();
    expect(screen.getByText("Secado")).toBeInTheDocument();
    expect(screen.getByText("Y además:")).toBeInTheDocument();
    expect(screen.getByText("Corte de raza")).toBeInTheDocument();
    expect(screen.getByText("Corte de uñas")).toBeInTheDocument();
    expect(screen.getByText(/solo si lo solicitas/i)).toBeInTheDocument();

    // ≤2 packages → expanded by default; it can be collapsed.
    await user.click(screen.getByRole("button", { name: /ocultar detalle/i }));
    expect(screen.queryByText("Corte de raza")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ver qué incluye/i }));
    expect(screen.getByText("Corte de raza")).toBeInTheDocument();

    // Picking it stores the service and advances to the pet step.
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
    );
    await user.click(screen.getByRole("button", { name: /elegir este paquete/i }));
    expect(
      await screen.findByRole("heading", { name: /para cuál de tus doggos/i }),
    ).toBeInTheDocument();
    expect(useBookingFlowStore.getState().service?.id).toBe("srv-matrix");
  });

  it("captures missing weight and coat type inline, PATCHes the pet and continues", { timeout: 20000 }, async () => {
    seedMatrixFlow();
    let patched: Record<string, unknown> | null = null;
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ id: "pet-1", name: "Nala" })])),
      ),
      http.get(`${API}/pets/pet-1/`, () =>
        HttpResponse.json(
          patched
            ? makePet({ id: "pet-1", weight: "5.20", coat_type: "SHORT" })
            : makePet({ id: "pet-1", weight: null, coat_type: null }),
        ),
      ),
      http.get(`${API}/services/grooming/quote/`, () =>
        patched
          ? HttpResponse.json(QUOTE_OK)
          : HttpResponse.json(
              { error: "La mascota no tiene peso registrado." },
              { status: 400 },
            ),
      ),
      http.patch(`${API}/pets/pet-1/update-complete/`, async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makePet({ id: "pet-1", weight: "5.20", coat_type: "SHORT" }),
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/pet");

    await user.click(await screen.findByRole("button", { name: /nala/i }));

    const weight = await screen.findByLabelText(/peso \(kg\)/i);
    expect(screen.getByText(/pegado al cuerpo/i)).toBeInTheDocument();
    expect(screen.getByText(/largo, rizado o doble capa/i)).toBeInTheDocument();
    // The old "Completar perfil" redirect is gone.
    expect(screen.queryByRole("link", { name: /completar perfil/i })).not.toBeInTheDocument();

    // Client-side validation: > 150 kg and no coat chosen.
    await user.type(weight, "200");
    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));
    expect(await screen.findByText(/ingresa un peso válido/i)).toBeInTheDocument();
    expect(screen.getByText(/elige el tipo de pelo/i)).toBeInTheDocument();
    expect(patched).toBeNull();

    await user.clear(weight);
    await user.type(weight, "5.2");
    await user.click(screen.getByRole("radio", { name: /pelo corto/i }));
    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    // Re-quotes and continues to the grooming-extras step.
    expect(await screen.findByRole("button", { name: /perfume/i })).toBeInTheDocument();
    expect(patched).toEqual({ weight: "5.20", coat_type: "SHORT" });
    expect(useBookingFlowStore.getState().pet?.id).toBe("pet-1");
    expect(useBookingFlowStore.getState().service?.price).toBe("350.00");
  });

  it("only asks for the missing field and surfaces API errors inline", async () => {
    seedMatrixFlow();
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ id: "pet-1", name: "Nala" })])),
      ),
      http.get(`${API}/pets/pet-1/`, () =>
        HttpResponse.json(makePet({ id: "pet-1", weight: "8.00", coat_type: null })),
      ),
      http.get(`${API}/services/grooming/quote/`, () =>
        HttpResponse.json({ error: "Falta el tipo de pelo." }, { status: 400 }),
      ),
      http.patch(`${API}/pets/pet-1/update-complete/`, () =>
        HttpResponse.json(
          { coat_type: ["Valor inválido."] },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/pet");

    await user.click(await screen.findByRole("button", { name: /nala/i }));
    await user.click(await screen.findByRole("radio", { name: /pelo largo/i }));
    expect(screen.queryByLabelText(/peso \(kg\)/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Valor inválido.");
  });

  it("sends the customer back to the pet step when availability says pet_missing_data", async () => {
    seedMatrixFlow({ pet: { id: "pet-1", name: "Nala" } });
    server.use(
      http.get(`${API}/appointments/availability/`, () =>
        HttpResponse.json(
          {
            error: "La mascota no tiene tipo de pelo.",
            code: "pet_missing_data",
            missing: ["coat_type"],
          },
          { status: 400 },
        ),
      ),
      http.get(`${API}/services/grooming/quote/`, () =>
        HttpResponse.json({ error: "Falta el tipo de pelo." }, { status: 400 }),
      ),
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ id: "pet-1", name: "Nala" })])),
      ),
      http.get(`${API}/pets/pet-1/`, () =>
        HttpResponse.json(makePet({ id: "pet-1", weight: "8.00", coat_type: null })),
      ),
    );

    renderWizard("/book/slot");

    expect(
      await screen.findByRole("heading", { name: /para cuál de tus doggos/i }),
    ).toBeInTheDocument();
    // The inline capture opens for that pet straight away.
    expect(await screen.findByText("Tipo de pelo")).toBeInTheDocument();
  });

  it("slot back button goes to grooming-extras only when that step has options", async () => {
    seedMatrixFlow({ pet: { id: "pet-1", name: "Nala" } });
    let extras = QUOTE_OK.extras;
    server.use(
      http.get(`${API}/appointments/availability/`, () =>
        HttpResponse.json({
          service: "srv-matrix",
          date: "2030-06-01",
          duration_minutes: 45,
          starts: [],
        }),
      ),
      http.get(`${API}/services/grooming/quote/`, () =>
        HttpResponse.json({ ...QUOTE_OK, extras }),
      ),
    );

    const { unmount } = renderWizard("/book/slot");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /atrás/i })).toHaveAttribute(
        "href",
        "/book/grooming-extras",
      ),
    );
    expect(screen.getByText(/duración aprox\. 45 min para nala/i)).toBeInTheDocument();
    unmount();

    // Empty extras catalog → grooming-extras would auto-forward back
    // here, so "Atrás" must go to the pet step instead.
    extras = [];
    renderWizard("/book/slot");
    expect(await screen.findByText(/no hay horarios disponibles/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /atrás/i })).toHaveAttribute(
      "href",
      "/book/pet",
    );
  });

  it("slot back button goes to the pet step for FLAT services", async () => {
    seedMatrixFlow({
      pet: { id: "pet-1", name: "Nala" },
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
        pricingMode: "FLAT",
      },
    });
    server.use(
      http.get(`${API}/appointments/availability/`, () =>
        HttpResponse.json({
          service: "srv-1",
          date: "2030-06-01",
          duration_minutes: 60,
          starts: [],
        }),
      ),
    );

    renderWizard("/book/slot");
    expect(await screen.findByText(/no hay horarios disponibles/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /atrás/i })).toHaveAttribute(
      "href",
      "/book/pet",
    );
  });

  it("landing resumes at the pet step before the slot step", async () => {
    seedMatrixFlow({
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
        pricingMode: "FLAT",
      },
      slot: {
        slotId: "slot-1",
        start: "2030-06-01T16:00:00Z",
        end: "2030-06-01T17:00:00Z",
        resource: null,
      },
      pet: null,
    });
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ id: "pet-1", name: "Nala" })])),
      ),
    );

    renderWizard("/book");
    expect(
      await screen.findByRole("heading", { name: /para cuál de tus doggos/i }),
    ).toBeInTheDocument();
  });

  it("landing resumes a matrix booking with a pet at grooming-extras, a FLAT one at slot", async () => {
    seedMatrixFlow({ pet: { id: "pet-1", name: "Nala" } });
    server.use(
      http.get(`${API}/services/grooming/quote/`, () => HttpResponse.json(QUOTE_OK)),
    );

    const { unmount } = renderWizard("/book");
    expect(
      await screen.findByRole("heading", { name: /algo más para tu doggo/i }),
    ).toBeInTheDocument();
    unmount();

    seedMatrixFlow({
      pet: { id: "pet-1", name: "Nala" },
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
        pricingMode: "FLAT",
      },
    });
    server.use(
      http.get(`${API}/appointments/availability/`, () =>
        HttpResponse.json({
          service: "srv-1",
          date: "2030-06-01",
          duration_minutes: 60,
          starts: [],
        }),
      ),
    );
    renderWizard("/book");
    expect(await screen.findByRole("heading", { name: /cuándo/i })).toBeInTheDocument();
  });
});
