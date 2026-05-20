import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/types/retail";

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  photo: string | null;
  price: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];

  add: (product: Product, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const MAX_QTY_PER_ITEM = 99;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product, quantity) =>
        set((state) => {
          const qty = clamp(quantity, 1, MAX_QTY_PER_ITEM);
          const existing = state.items.find(
            (i) => i.productId === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: clamp(
                        i.quantity + qty,
                        1,
                        MAX_QTY_PER_ITEM,
                      ),
                    }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                brand: product.brand,
                photo: product.photo,
                price: product.price,
                quantity: qty,
              },
            ],
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: clamp(quantity, 0, MAX_QTY_PER_ITEM) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "doggo:cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Selectors
export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}

export function selectCartSubtotal(state: CartState): number {
  return state.items.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0,
  );
}
