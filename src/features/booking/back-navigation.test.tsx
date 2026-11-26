import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useResetBookingOnLeave } from "@/features/booking/hooks/use-reset-booking-on-leave";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { useBookingFlowStore } from "@/stores/booking-flow-store";

function seedFullFlow() {
  const store = useBookingFlowStore.getState();
  store.reset();
  useBookingFlowStore.setState({
    businessUnitCode: "GROOMING",
    location: { id: "loc", name: "Carso Palmas", businessUnitId: "bu" } as never,
    service: { id: "plus", name: "Plus" } as never,
    pet: { id: "pet", name: "Fds" } as never,
    groomingExtras: [{ id: "x", name: "Higiene", priceMin: "90", priceMax: "90", isFixedPrice: true }],
    slot: { slotId: "w", start: "s", end: "e", resource: null } as never,
    notes: "nota",
  });
}

beforeEach(seedFullFlow);

describe("clearFromStep", () => {
  it("limpia el paso destino y los siguientes, conserva los anteriores", () => {
    useBookingFlowStore.getState().clearFromStep("service");
    const s = useBookingFlowStore.getState();
    expect(s.businessUnitCode).toBe("GROOMING");
    expect(s.location).not.toBeNull();
    expect(s.service).toBeNull();
    expect(s.pet).toBeNull();
    expect(s.groomingExtras).toEqual([]);
    expect(s.slot).toBeNull();
    expect(s.notes).toBe("");
  });
});

function withQuery(ui: React.ReactElement) {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

describe("Atrás en el wizard", () => {
  it("regresar a 'servicio' deja el servicio sin seleccionar", async () => {
    render(withQuery(
      <MemoryRouter initialEntries={["/book/pet"]}>
        <Routes>
          <Route
            path="/book/pet"
            element={<BookingStepHeader stepKey="pet" backTo="/book/service" title="Mascota" />}
          />
          <Route path="/book/service" element={<p>servicio</p>} />
        </Routes>
      </MemoryRouter>,
    ));
    await userEvent.click(screen.getByRole("link", { name: /Atrás/ }));
    expect(screen.getByText("servicio")).toBeInTheDocument();
    expect(useBookingFlowStore.getState().service).toBeNull();
    expect(useBookingFlowStore.getState().location).not.toBeNull();
  });

  it("'Atrás' fuera del wizard lo limpia todo", async () => {
    render(withQuery(
      <MemoryRouter initialEntries={["/book/business-unit"]}>
        <Routes>
          <Route
            path="/book/business-unit"
            element={<BookingStepHeader stepKey="business-unit" backTo="/" title="Tipo" />}
          />
          <Route path="/" element={<p>inicio</p>} />
        </Routes>
      </MemoryRouter>,
    ));
    await userEvent.click(screen.getByRole("link", { name: /Atrás/ }));
    expect(useBookingFlowStore.getState().businessUnitCode).toBeNull();
  });
});

describe("useResetBookingOnLeave", () => {
  let go: (path: string) => void = () => {};
  function Shell() {
    useResetBookingOnLeave();
    const navigate = useNavigate();
    go = navigate;
    return null;
  }
  function renderAt(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("salir del flujo descarta la reserva en curso", () => {
    renderAt("/book/slot");
    act(() => go("/"));
    expect(useBookingFlowStore.getState().service).toBeNull();
    expect(useBookingFlowStore.getState().businessUnitCode).toBeNull();
  });

  it("moverse entre pasos o dar de alta una mascota no la descarta", () => {
    renderAt("/book/slot");
    act(() => go("/book/addons"));
    expect(useBookingFlowStore.getState().service).not.toBeNull();
    act(() => go("/pets/new"));
    expect(useBookingFlowStore.getState().service).not.toBeNull();
  });

  it("recargar dentro del flujo (sin cambio de ruta) la conserva", () => {
    renderAt("/book/slot");
    expect(useBookingFlowStore.getState().slot).not.toBeNull();
  });
});
