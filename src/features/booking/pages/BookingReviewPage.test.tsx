import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { BookingReviewPage } from "./BookingReviewPage";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { server } from "@/test/msw-server";
import { makeTestQueryClient } from "@/test/test-utils";
import { makePetListItem } from "@/test/fixtures";

const API = "http://localhost/api";

function start(slotId: string, startISO: string, endISO: string) {
  return {
    start: startISO,
    end: endISO,
    slot_id: slotId,
    resource: "res-1",
    staff_user: null,
  };
}

function availability(starts: ReturnType<typeof start>[]) {
  return {
    service: "srv-1",
    date: "2030-01-15",
    duration_minutes: 60,
    starts,
  };
}

function seedFlow() {
  useBookingFlowStore.setState({
    businessUnitCode: "GROOMING",
    location: {
      id: "loc-1",
      name: "Sucursal Polanco",
      address: "Av. Polanco 1",
      businessUnitId: "bu-1",
      businessUnitName: "Grooming Polanco",
    },
    service: {
      id: "srv-1",
      name: "Corte completo",
      price: "450.00",
      durationMinutes: 60,
      requiresPet: true,
      pricingMode: "FLAT",
    },
    slot: {
      slotId: "slot-1",
      start: "2030-01-15T16:00:00Z",
      end: "2030-01-15T17:00:00Z",
      resource: "res-1",
    },
    pet: { id: "pet-1", name: "Nala" },
    notes: "",
  });
}

function renderReview(queryClient: QueryClient = makeTestQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/book/review"]}>
        <Routes>
          <Route path="/book/review" element={<BookingReviewPage />} />
          <Route
            path="/my/appointments"
            element={<div data-testid="appointments-page">Mis citas</div>}
          />
          <Route
            path="/book/business-unit"
            element={<div data-testid="bu-page">BU</div>}
          />
          <Route
            path="/book/location"
            element={<div data-testid="location-page">Location picker</div>}
          />
          <Route
            path="/book/slot"
            element={<div data-testid="slot-page">Slot picker</div>}
          />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BookingReviewPage", () => {
  it("posts the nested payload and navigates to /my/appointments on success", async () => {
    seedFlow();
    let capturedPayload: unknown = null;
    server.use(
      http.post(`${API}/appointments/`, async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    // After success, the page swaps to the success animation which auto-navigates
    // a few seconds later. Assert the success UI first — it's the immediate
    // post-mutation contract of this component.
    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();

    expect(capturedPayload).toMatchObject({
      business_unit: "bu-1",
      pet: "pet-1",
      scheduled_start: "2030-01-15T16:00:00Z",
      channel: "web",
      items: [{ service: "srv-1", resource: "res-1", slot_id: "slot-1" }],
    });
    // F-G windows: the server computes the end from the real duration.
    expect(capturedPayload).not.toHaveProperty("scheduled_end");

    // Critical: NOT back at the BU picker thanks to the success branch.
    expect(screen.queryByTestId("bu-page")).not.toBeInTheDocument();
  });

  it("displays pre-selected grooming extras and forwards their ids in the payload", async () => {
    seedFlow();
    useBookingFlowStore.setState({
      groomingExtras: [
        {
          id: "extra-1",
          name: "Perfume",
          priceMin: "80.00",
          priceMax: "80.00",
          isFixedPrice: true,
        },
        {
          id: "extra-2",
          name: "Desenredado",
          priceMin: "100.00",
          priceMax: "300.00",
          isFixedPrice: false,
        },
      ],
    });
    let capturedPayload: unknown = null;
    server.use(
      http.post(`${API}/appointments/`, async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderReview();

    expect(screen.getByText("Opciones de grooming")).toBeInTheDocument();
    expect(screen.getByText("Perfume")).toBeInTheDocument();
    expect(screen.getByText("Desenredado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));
    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();

    expect(capturedPayload).toMatchObject({
      items: [{ service: "srv-1", extras: ["extra-1", "extra-2"] }],
    });
  });

  it("shows the backend error message when create returns 400", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            detail: "El recurso ya no tiene disponibilidad.",
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    expect(
      await screen.findByText(/ya no tiene disponibilidad/i),
    ).toBeInTheDocument();
    // Did NOT navigate away
    expect(screen.queryByTestId("appointments-page")).not.toBeInTheDocument();
  });

  it("sends the customer back to the slot step when the slot was taken meanwhile", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          { scheduled_start: "Ese horario ya no está disponible. Elige otro." },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    expect(await screen.findByTestId("slot-page")).toBeInTheDocument();
    expect(
      await screen.findByText("Ese horario ya no está disponible. Elige otro."),
    ).toBeInTheDocument();
    expect(useBookingFlowStore.getState().slot).toBeNull();
    // The rest of the wizard survives so the customer only re-picks a time.
    expect(useBookingFlowStore.getState().pet?.id).toBe("pet-1");
  });

  it("shows the duration of the booked window (start → end), not the service default", () => {
    seedFlow();
    useBookingFlowStore.setState({
      slot: {
        slotId: "slot-1",
        start: "2030-01-15T16:00:00Z",
        end: "2030-01-15T17:10:00Z",
        resource: "res-1",
      },
    });
    renderReview();
    expect(screen.getByText(/70 min/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 – 11:10/)).toBeInTheDocument();
  });

  it("redirects to the earliest missing step when the store is incomplete", () => {
    useBookingFlowStore.getState().reset();
    renderReview();
    // First guard in the page sends us to /book/location when state.location is null
    expect(screen.getByTestId("location-page")).toBeInTheDocument();
  });

  it("offers a follow-up slot for the user's other pet after a successful booking", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        ),
      ),
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            makePetListItem({ id: "pet-1", name: "Nala" }),
            makePetListItem({ id: "pet-2", name: "Max" }),
          ],
        }),
      ),
      http.get(`${API}/appointments/availability/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("service")).toBe("srv-1");
        expect(url.searchParams.get("date")).toBe("2030-01-15");
        expect(url.searchParams.get("pet")).toBe("pet-2");
        return HttpResponse.json(
          availability([
            start("slot-2", "2030-01-15T17:00:00Z", "2030-01-15T18:00:00Z"),
          ]),
        );
      }),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /confirmar reserva/i }),
    );

    // Wait for the success branch + the follow-up suggestion card.
    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();
    const suggestionButton = await screen.findByRole("button", {
      name: /corte completo para max/i,
    });
    expect(suggestionButton).toBeInTheDocument();

    // Picking the suggestion should leave us on /book/review (same route)
    // with the pet swapped to Max in the wizard store, not auto-navigate
    // to /my/appointments.
    await user.click(suggestionButton);
    await waitFor(() => {
      expect(useBookingFlowStore.getState().pet?.id).toBe("pet-2");
    });
    expect(useBookingFlowStore.getState().slot?.slotId).toBe("slot-2");
    expect(screen.queryByTestId("appointments-page")).not.toBeInTheDocument();
  });

  it("books every suggestion at once when the user taps 'Reservar las N citas'", async () => {
    seedFlow();
    const postedPets: string[] = [];
    const postedBodies: Record<string, unknown>[] = [];
    server.use(
      http.post(`${API}/appointments/`, async ({ request }) => {
        const body = (await request.json()) as { pet: string };
        postedPets.push(body.pet);
        postedBodies.push(body);
        return HttpResponse.json(
          {
            id: `appt-${postedPets.length}`,
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: body.pet,
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        );
      }),
      // 3 pets total: the one just booked plus two for follow-up.
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({
          count: 3,
          next: null,
          previous: null,
          results: [
            makePetListItem({ id: "pet-1", name: "Nala" }),
            makePetListItem({ id: "pet-2", name: "Max" }),
            makePetListItem({ id: "pet-3", name: "Luna" }),
          ],
        }),
      ),
      // Availability is per pet; both see the same two starts on the
      // same lane, so they must be paired with non-overlapping ones.
      http.get(`${API}/appointments/availability/`, () =>
        HttpResponse.json(
          availability([
            start("slot-2", "2030-01-15T17:00:00Z", "2030-01-15T18:00:00Z"),
            start("slot-3", "2030-01-15T18:00:00Z", "2030-01-15T19:00:00Z"),
          ]),
        ),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /confirmar reserva/i }),
    );

    // Wait for both suggestion cards to render — confirms the chain has
    // settled before we click the bulk button.
    expect(
      await screen.findByRole("button", {
        name: /corte completo para max/i,
      }),
    ).toBeInTheDocument();

    const bulkButton = screen.getByRole("button", {
      name: /reservar las 2 citas/i,
    });
    await user.click(bulkButton);

    // 3 POSTs total: initial pet-1 + bulk pet-2 + bulk pet-3, in that order.
    await waitFor(() =>
      expect(postedPets).toEqual(["pet-1", "pet-2", "pet-3"]),
    );
    expect(postedBodies[1]).toMatchObject({
      scheduled_start: "2030-01-15T17:00:00Z",
      items: [{ service: "srv-1", slot_id: "slot-2", resource: "res-1" }],
    });
    expect(postedBodies[2]).toMatchObject({
      scheduled_start: "2030-01-15T18:00:00Z",
      items: [{ slot_id: "slot-3" }],
    });
    expect(postedBodies[1]).not.toHaveProperty("scheduled_end");
    await waitFor(() =>
      expect(screen.getByTestId("appointments-page")).toBeInTheDocument(),
    );
  });

  it("clears the wizard store on success so the nav doesn't fast-forward to a stale review", async () => {
    seedFlow();
    server.use(
      http.post(`${API}/appointments/`, () =>
        HttpResponse.json(
          {
            id: "appt-1",
            business_unit: "bu-1",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-01-15T16:00:00Z",
            scheduled_end: "2030-01-15T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-01-01T00:00:00Z",
            updated_at: "2030-01-01T00:00:00Z",
          },
          { status: 201 },
        ),
      ),
      // Single pet — no follow-up suggestions, so the chain doesn't keep
      // the store hydrated for that path.
      http.get(`${API}/pets/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [makePetListItem({ id: "pet-1", name: "Nala" })],
        }),
      ),
    );

    const user = userEvent.setup();
    renderReview();
    await user.click(
      screen.getByRole("button", { name: /confirmar reserva/i }),
    );

    expect(await screen.findByText(/¡listo!/i)).toBeInTheDocument();

    // After capturing the snapshot on success, the wizard store should be
    // empty — otherwise tapping "Reservar" in the nav while still on this
    // screen would land the user on a stale review for what they just
    // confirmed.
    await waitFor(() => {
      expect(useBookingFlowStore.getState().pet).toBeNull();
    });
    expect(useBookingFlowStore.getState().location).toBeNull();
    expect(useBookingFlowStore.getState().service).toBeNull();
    expect(useBookingFlowStore.getState().slot).toBeNull();
  });
});
