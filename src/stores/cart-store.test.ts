import { afterEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cart-store";
import { makeProduct } from "@/test/fixtures";

afterEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart-store", () => {
  it("never adds a product with no availability", () => {
    useCartStore
      .getState()
      .add(makeProduct({ in_stock: false, max_available: 0 }), 1);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("caps the item quantity at max_available across repeated adds", () => {
    const product = makeProduct({ max_available: 3 });
    useCartStore.getState().add(product, 2);
    useCartStore.getState().add(product, 5);
    const [item] = useCartStore.getState().items;
    expect(item.quantity).toBe(3);
    expect(item.maxAvailable).toBe(3);
  });

  it("setQuantity enforces the stored max and accepts a fresher one", () => {
    useCartStore.getState().add(makeProduct({ max_available: 2 }), 1);
    useCartStore.getState().setQuantity("prod-1", 10);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    useCartStore.getState().setQuantity("prod-1", 4, 6);
    expect(useCartStore.getState().items[0]).toMatchObject({
      quantity: 4,
      maxAvailable: 6,
    });
  });
});
