import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BusinessUnitCode } from "@/types/business-unit";

/**
 * Snapshot of the Location selected in step 2.
 *
 * `businessUnitId` is the UUID of the `BusinessUnit` inside the location that
 * matches the code picked in step 1 (e.g. the "Grooming Polanco" BU when the
 * user picked GROOMING at Polanco). Pre-resolving it here lets every
 * downstream step — service filtering, slot querying, appointment creation —
 * reuse the same UUID without redoing the lookup.
 */
export interface BookingLocationSnapshot {
  id: string;
  name: string;
  address: string;
  businessUnitId: string;
  businessUnitName: string;
}

export interface BookingServiceSnapshot {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
  requiresPet: boolean;
}

export interface BookingSlotSnapshot {
  slotId: string;
  start: string;
  end: string;
  resource: string | null;
}

export interface BookingPetSnapshot {
  id: string;
  name: string;
}

/**
 * F4-D: snapshot of a retail add-on picked from the optional
 * "Agregar productos" step of the wizard. Kept intentionally
 * separate from `useCartStore` (which drives the standalone /shop
 * checkout) — a customer's booking cart and shop cart are distinct
 * baskets and must not leak into each other.
 */
export interface BookingAddonSnapshot {
  productId: string;
  name: string;
  price: string;
  photo: string | null;
  quantity: number;
}

interface BookingFlowState {
  businessUnitCode: BusinessUnitCode | null;
  location: BookingLocationSnapshot | null;
  service: BookingServiceSnapshot | null;
  slot: BookingSlotSnapshot | null;
  pet: BookingPetSnapshot | null;
  addons: BookingAddonSnapshot[];
  notes: string;

  setBusinessUnit: (code: BusinessUnitCode) => void;
  setLocation: (location: BookingLocationSnapshot) => void;
  setService: (service: BookingServiceSnapshot) => void;
  setSlot: (slot: BookingSlotSnapshot) => void;
  setPet: (pet: BookingPetSnapshot) => void;
  setAddonQuantity: (
    product: Omit<BookingAddonSnapshot, "quantity">,
    quantity: number,
  ) => void;
  removeAddon: (productId: string) => void;
  clearAddons: () => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  businessUnitCode: null,
  location: null,
  service: null,
  slot: null,
  pet: null,
  addons: [] as BookingAddonSnapshot[],
  notes: "",
};

// Add-on inventory is scoped per location. Whenever the customer
// picks a different location the previously-picked add-ons might
// not be in stock at the new one, so wipe them to avoid a confusing
// 400 at checkout time.
export const useBookingFlowStore = create<BookingFlowState>()(
  persist(
    (set) => ({
      ...initialState,

      setBusinessUnit: (code) =>
        set({
          businessUnitCode: code,
          location: null,
          service: null,
          slot: null,
          addons: [],
        }),

      setLocation: (location) =>
        set({
          location,
          service: null,
          slot: null,
          addons: [],
        }),

      setService: (service) =>
        set({
          service,
          slot: null,
        }),

      setSlot: (slot) => set({ slot }),

      setPet: (pet) => set({ pet }),

      setAddonQuantity: (product, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              addons: state.addons.filter(
                (a) => a.productId !== product.productId,
              ),
            };
          }
          const existing = state.addons.find(
            (a) => a.productId === product.productId,
          );
          if (existing) {
            return {
              addons: state.addons.map((a) =>
                a.productId === product.productId
                  ? { ...a, quantity }
                  : a,
              ),
            };
          }
          return {
            addons: [...state.addons, { ...product, quantity }],
          };
        }),

      removeAddon: (productId) =>
        set((state) => ({
          addons: state.addons.filter((a) => a.productId !== productId),
        })),

      clearAddons: () => set({ addons: [] }),

      setNotes: (notes) => set({ notes }),

      reset: () => set(initialState),
    }),
    {
      name: "doggo:booking-flow",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

// Convenience selector — total add-ons MXN (IVA-incl) for the review
// summary. Placed here (module-scope, not on state) so component
// re-renders only when relevant slices change.
export function selectBookingAddonsSubtotal(state: BookingFlowState): number {
  return state.addons.reduce(
    (sum, a) => sum + Number(a.price) * a.quantity,
    0,
  );
}

export function selectBookingAddonsCount(state: BookingFlowState): number {
  return state.addons.reduce((sum, a) => sum + a.quantity, 0);
}
