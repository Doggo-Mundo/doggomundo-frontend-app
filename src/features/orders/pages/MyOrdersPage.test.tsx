import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { MyOrdersPage } from "./MyOrdersPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { makeOrderListItem, makePetListItem } from "@/test/fixtures";

const API = "http://localhost/api";

function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

describe("MyOrdersPage", () => {
  it("renders an empty state when there are no orders", async () => {
    server.use(
      http.get(`${API}/orders/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
    );
    renderWithProviders(<MyOrdersPage />);
    expect(
      await screen.findByText(/aún no tienes órdenes/i),
    ).toBeInTheDocument();
  });

  it("lists orders with formatted total and cross-referenced pet name", async () => {
    server.use(
      http.get(`${API}/orders/`, () =>
        HttpResponse.json(
          paginated([
            makeOrderListItem({
              id: "o-1",
              total: "450.00",
              pet: "pet-1",
            }),
            makeOrderListItem({
              id: "o-2",
              total: "199.00",
              pet: null,
              appointment: null,
              paid_at: null,
              status: "draft",
              status_display: "Pendiente",
            }),
          ]),
        ),
      ),
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(paginated([makePetListItem({ name: "Nala" })])),
      ),
    );

    renderWithProviders(<MyOrdersPage />);

    // Money formatting uses Intl with a narrow no-break space
    await waitFor(() =>
      expect(screen.getByText(/450\.00/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/199\.00/)).toBeInTheDocument();

    // Pet name only on the order that has a pet FK
    expect(screen.getByText("Nala")).toBeInTheDocument();

    // Status badge "Pagada" appears both in the header ("Pagada el ...") and
    // in the badge — use getAllByText to cover both.
    expect(screen.getAllByText(/pagada/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });
});
