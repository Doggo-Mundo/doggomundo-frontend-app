import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { CartPage } from "./CartPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { useCartStore, type CartItem } from "@/stores/cart-store";

const API = "http://localhost/api";

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "p-1",
    name: "Kong",
    brand: "Kong",
    photo: null,
    price: "250.00",
    quantity: 1,
    ...overrides,
  };
}

afterEach(() => {
  useCartStore.setState({ items: [] });
});

describe("CartPage", () => {
  it("flags sold-out / short items and blocks checkout until fixed", async () => {
    useCartStore.setState({
      items: [
        cartItem({ productId: "p-1", name: "Kong", quantity: 1 }),
        cartItem({ productId: "p-2", name: "Pelota", quantity: 4 }),
      ],
    });
    server.use(
      http.get(`${API}/memberships/`, () => HttpResponse.json([])),
      http.post(`${API}/retail/cart/availability/`, async ({ request }) => {
        const body = (await request.json()) as {
          items: { product_id: string; quantity: number }[];
        };
        const qty = (id: string) =>
          body.items.find((i) => i.product_id === id)?.quantity ?? 0;
        return HttpResponse.json({
          locations: [],
          items: body.items.map((i) =>
            i.product_id === "p-1"
              ? {
                  product_id: "p-1", product_name: "Kong",
                  requested: qty("p-1"), max_available: 0, available_at: [],
                }
              : {
                  product_id: "p-2", product_name: "Pelota",
                  requested: qty("p-2"), max_available: 2,
                  available_at: qty("p-2") <= 2 ? ["Polanco"] : [],
                },
          ),
        });
      }),
    );

    const { user } = renderWithProviders(<CartPage />);

    expect(await screen.findByText(/agotado — quítalo/i)).toBeInTheDocument();
    expect(screen.getByText(/solo hay 2 disponibles/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ir al pago/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /ajustar a 2/i }));
    await user.click(screen.getByRole("button", { name: /^quitar$/i }));

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ productId: "p-2", quantity: 2 }),
    ]);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /ir al pago/i })).toBeEnabled(),
    );
  });
});
