import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SubscribePage } from "./SubscribePage";
import { server } from "@/test/msw-server";
import { makePlan } from "@/test/fixtures";
import { makeTestQueryClient } from "@/test/test-utils";

const API = "http://localhost/api";

function renderAt(planId: string) {
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/memberships/subscribe/${planId}`]}>
        <Routes>
          <Route
            path="/memberships/subscribe/:planId"
            element={<SubscribePage />}
          />
          <Route
            path="/my/subscriptions/:id"
            element={<div data-testid="sub-detail">Detalle</div>}
          />
          <Route
            path="/memberships"
            element={<div data-testid="catalog">Catálogo</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SubscribePage", () => {
  it("shows the plan details and posts { plan } on confirm, then navigates to detail", async () => {
    const plan = makePlan({ id: "plan-abc" });
    let captured: unknown = null;
    server.use(
      http.get(`${API}/memberships/plans/`, () =>
        HttpResponse.json([plan]),
      ),
      http.post(`${API}/memberships/subscribe/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(
          {
            id: "sub-1",
            plan: plan.id,
            plan_name: plan.name,
            status: "active",
            status_display: "Activa",
            start_date: "2026-05-10",
            current_period_start: "2026-05-10",
            current_period_end: "2026-06-10",
            active_balances: [],
            cycles_count: 1,
            created_at: "2026-05-10T00:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderAt(plan.id);

    // Wait for plan to render
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /premium mensual/i }),
      ).toBeInTheDocument(),
    );

    // Entitlements shown
    expect(screen.getByText(/baño básico/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /confirmar suscripción/i }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("sub-detail")).toBeInTheDocument(),
    );
    expect(captured).toEqual({ plan: plan.id });
  });

  it("shows an empty state when the plan does not exist", async () => {
    server.use(
      http.get(`${API}/memberships/plans/`, () =>
        HttpResponse.json([]),
      ),
    );
    renderAt("missing-plan");

    expect(
      await screen.findByText(/no encontramos este plan/i),
    ).toBeInTheDocument();
  });

  it("surfaces backend 400 errors", async () => {
    const plan = makePlan({ id: "plan-x" });
    server.use(
      http.get(`${API}/memberships/plans/`, () =>
        HttpResponse.json([plan]),
      ),
      http.post(`${API}/memberships/subscribe/`, () =>
        HttpResponse.json(
          { plan: ["Ya tienes una suscripción activa a este plan."] },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderAt(plan.id);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /premium mensual/i }),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: /confirmar suscripción/i }),
    );

    expect(
      await screen.findByText(/ya tienes una suscripción activa/i),
    ).toBeInTheDocument();
  });
});
