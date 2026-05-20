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

interface BookingFlowState {
  businessUnitCode: BusinessUnitCode | null;
  location: BookingLocationSnapshot | null;
  service: BookingServiceSnapshot | null;
  slot: BookingSlotSnapshot | null;
  pet: BookingPetSnapshot | null;
  notes: string;

  setBusinessUnit: (code: BusinessUnitCode) => void;
  setLocation: (location: BookingLocationSnapshot) => void;
  setService: (service: BookingServiceSnapshot) => void;
  setSlot: (slot: BookingSlotSnapshot) => void;
  setPet: (pet: BookingPetSnapshot) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  businessUnitCode: null,
  location: null,
  service: null,
  slot: null,
  pet: null,
  notes: "",
};

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
        }),

      setLocation: (location) =>
        set({
          location,
          service: null,
          slot: null,
        }),

      setService: (service) =>
        set({
          service,
          slot: null,
        }),

      setSlot: (slot) => set({ slot }),

      setPet: (pet) => set({ pet }),

      setNotes: (notes) => set({ notes }),

      reset: () => set(initialState),
    }),
    {
      name: "doggo:booking-flow",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
