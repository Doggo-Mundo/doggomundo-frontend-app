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
  /** Último máximo pedible conocido (unidades en UNA sucursal). Se
   *  guarda al agregar desde el catálogo y se refresca con la
   *  disponibilidad del carrito. undefined = desconocido (items
   *  persistidos antes de que existiera el campo). */
  maxAvailable?: number;
}

interface CartState {
  items: CartItem[];

  /** Agrega `quantity` unidades sin pasar de `product.max_available`
   *  (ni de MAX_QTY_PER_ITEM). Un producto agotado no se agrega. */
  add: (product: Product, quantity: number) => void;
  /** Fija la cantidad, acotada al máximo del item. Pasa `maxAvailable`
   *  cuando se conoce uno más reciente (también lo guarda). 0 = quitar. */
  setQuantity: (
    productId: string,
    quantity: number,
    maxAvailable?: number,
  ) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const MAX_QTY_PER_ITEM = 99;

/** Tope efectivo por item: el stock conocido, nunca más de 99. */
export function itemCap(maxAvailable: number | undefined): number {
  if (maxAvailable === undefined) return MAX_QTY_PER_ITEM;
  return Math.max(0, Math.min(maxAvailable, MAX_QTY_PER_ITEM));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product, quantity) =>
        set((state) => {
          const cap = itemCap(product.max_available);
          if (cap <= 0 || quantity <= 0) return state;
          const existing = state.items.find(
            (i) => i.productId === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: clamp(i.quantity + quantity, 1, cap),
                      maxAvailable: product.max_available,
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
                quantity: clamp(quantity, 1, cap),
                maxAvailable: product.max_available,
              },
            ],
          };
        }),

      setQuantity: (productId, quantity, maxAvailable) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const max = maxAvailable ?? i.maxAvailable;
              return {
                ...i,
                maxAvailable: max,
                quantity: clamp(quantity, 0, itemCap(max)),
              };
            })
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
