import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { CheckoutPage } from "./CheckoutPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { useCartStore } from "@/stores/cart-store";
import type { CartAvailabilityResponse } from "@/types/retail";

const API = "http://localhost/api";

const POLANCO = {
  id: "loc-polanco", name: "Polanco", address: "Av. Masaryk 1",
};
const CARSO = {
  id: "loc-carso", name: "Carso Palmas", address: "Palmas 2",
};

function mockAvailability(body: CartAvailabilityResponse) {
  let calls = 0;
  server.use(
    http.post(`${API}/retail/cart/availability/`, () => {
      calls += 1;
      return HttpResponse.json(body);
    }),
  );
  return () => calls;
}

beforeEach(() => {
  useCartStore.setState({
    items: [
      {
        productId: "p-kong", name: "Kong", brand: "Kong", photo: null,
        price: "250.00", quantity: 1,
      },
      {
        productId: "p-pelota", name: "Pelota", brand: "", photo: null,
        price: "90.00", quantity: 2,
      },
    ],
  });
  server.use(http.get(`${API}/memberships/`, () => HttpResponse.json([])));
});

afterEach(() => {
  useCartStore.setState({ items: [] });
});

describe("CheckoutPage", () => {
  it("disables sucursales that can't fulfill and defaults to one that can", async () => {
    mockAvailability({
      locations: [
        {
          ...POLANCO,
          can_fulfill: false,
          missing: [
            { product_id: "p-kong", product_name: "Kong", requested: 1, available: 0 },
          ],
        },
        { ...CARSO, can_fulfill: true, missing: [] },
      ],
      items: [],
    });

    renderWithProviders(<CheckoutPage />);

    const polanco = await screen.findByRole("button", { name: /polanco/i });
    expect(polanco).toBeDisabled();
    expect(polanco).toHaveTextContent("Falta: Kong (hay 0)");
    const carso = screen.getByRole("button", { name: /carso palmas/i });
    expect(carso).toBeEnabled();
    expect(carso).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /continuar con el pago/i }),
    ).toBeEnabled();
  });

  it("explains where each product is when no sucursal has the whole cart", async () => {
    mockAvailability({
      locations: [
        {
          ...POLANCO,
          can_fulfill: false,
          missing: [
            { product_id: "p-kong", product_name: "Kong", requested: 1, available: 0 },
          ],
        },
        {
          ...CARSO,
          can_fulfill: false,
          missing: [
            { product_id: "p-pelota", product_name: "Pelota", requested: 2, available: 0 },
            { product_id: "p-kong", product_name: "Kong", requested: 1, available: 0 },
          ],
        },
      ],
      items: [
        {
          product_id: "p-kong", product_name: "Kong", requested: 1,
          max_available: 0, available_at: [],
        },
        {
          product_id: "p-pelota", product_name: "Pelota", requested: 2,
          max_available: 5, available_at: ["Polanco"],
        },
      ],
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(/ninguna sucursal tiene todo tu pedido/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/solo en Polanco/)).toBeInTheDocument();
    expect(screen.getByText(/agotado/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ajustar mi carrito/i }),
    ).toHaveAttribute("href", "/cart");
    expect(
      screen.getByRole("button", { name: /carso palmas/i }),
    ).toHaveTextContent("Falta: Pelota (hay 0), Kong (hay 0)");
    expect(
      screen.getByRole("button", { name: /continuar con el pago/i }),
    ).toBeDisabled();
  });

  it("shows the backend detail on an out-of-stock 400 and refreshes availability", async () => {
    const calls = mockAvailability({
      locations: [{ ...CARSO, can_fulfill: true, missing: [] }],
      items: [],
    });
    let posted: unknown = null;
    server.use(
      http.post(`${API}/retail/checkout/`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(
          {
            detail: "Solo queda 1 de “Pelota” en Carso Palmas.",
            code: "out_of_stock",
            product_id: "p-pelota",
            product_name: "Pelota",
            requested: 2,
            available: 1,
          },
          { status: 400 },
        );
      }),
    );

    const { user } = renderWithProviders(<CheckoutPage />);

    const submit = await screen.findByRole("button", {
      name: /continuar con el pago/i,
    });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo queda 1 de “Pelota” en Carso Palmas.",
    );
    expect(posted).toEqual({
      pickup_location_id: "loc-carso",
      items: [
        { product_id: "p-kong", quantity: 1 },
        { product_id: "p-pelota", quantity: 2 },
      ],
    });
    await waitFor(() => expect(calls()).toBe(2));
  });

  it("falls back to a generic message when the error has no detail", async () => {
    mockAvailability({
      locations: [{ ...CARSO, can_fulfill: true, missing: [] }],
      items: [],
    });
    server.use(
      http.post(`${API}/retail/checkout/`, () =>
        HttpResponse.json({ items: ["inválido"] }, { status: 400 }),
      ),
    );

    const { user } = renderWithProviders(<CheckoutPage />);
    const submit = await screen.findByRole("button", {
      name: /continuar con el pago/i,
    });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /no pudimos iniciar el pago/i,
    );
  });
});
