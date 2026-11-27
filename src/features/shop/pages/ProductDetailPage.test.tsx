import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { ProductDetailPage } from "./ProductDetailPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { makeProduct } from "@/test/fixtures";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/retail";

const API = "http://localhost/api";

function renderDetail(product: Product) {
  server.use(
    http.get(`${API}/retail/products/${product.id}/`, () =>
      HttpResponse.json(product),
    ),
  );
  return renderWithProviders(<ProductDetailPage />, {
    route: `/shop/products/${product.id}`,
    path: "/shop/products/:id",
  });
}

afterEach(() => {
  useCartStore.setState({ items: [] });
});

describe("ProductDetailPage", () => {
  it("disables both buttons and shows per-sucursal availability when sold out", async () => {
    renderDetail(
      makeProduct({
        in_stock: false,
        max_available: 0,
        availability: [
          { location_id: "loc-1", location_name: "Polanco", available: 0 },
        ],
      }),
    );

    const buttons = await screen.findAllByRole("button", { name: /agotado/i });
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByText("Agotado en Polanco")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: /selector de cantidad/i }),
    ).not.toBeInTheDocument();
  });

  it("caps the quantity at max_available and lists stock per sucursal", async () => {
    const { user } = renderDetail(
      makeProduct({
        max_available: 2,
        availability: [
          { location_id: "loc-1", location_name: "Carso Palmas", available: 2 },
          { location_id: "loc-2", location_name: "Polanco", available: 0 },
        ],
      }),
    );

    const plus = await screen.findByRole("button", {
      name: /aumentar cantidad/i,
    });
    await user.click(plus);
    expect(plus).toBeDisabled();
    expect(screen.getByText("Disponible en Carso Palmas (2)")).toBeInTheDocument();
    expect(screen.getByText("Agotado en Polanco")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /agregar al carrito/i }));
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("subtracts what is already in the cart from the cap", async () => {
    const product = makeProduct({ max_available: 3 });
    useCartStore.getState().add(product, 2);
    const { user } = renderDetail(product);

    expect(
      await screen.findByText(/ya tienes 2 en tu carrito; puedes agregar hasta 1 más/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /aumentar cantidad/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /agregar al carrito/i }));
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(
      await screen.findByText(/ya tienes 3 en tu carrito, el máximo disponible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /agregar al carrito/i }),
    ).toBeDisabled();
  });
});
