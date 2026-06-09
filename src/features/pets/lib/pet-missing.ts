import type { Pet, PetListItem } from "@/types/pet";

/**
 * Friendly one-line hint pointing at the first missing field of a pet profile.
 *
 * Used on cards and banners in the list/home views, where we only have the
 * limited `PetListItem` shape. Order is tuned for the lowest-effort win first
 * (photo, then visible identity fields) so the prompt feels achievable.
 */
export function nextMissingHintFromList(pet: PetListItem): string | null {
  if (pet.onboarding_completion_percentage >= 100) return null;
  if (!pet.photo) return "Súbele su foto";
  if (!pet.breed) return "Falta su raza";
  if (!pet.gender) return "Falta su sexo";
  return "Últimos detalles";
}

/**
 * The 8 fields that count toward the pet's onboarding %. Keep in sync with
 * `Pet.calculate_onboarding_status` on the backend.
 */
export interface ProfileField {
  key: string;
  label: string;
  filled: boolean;
}

export function profileFields(pet: Pet): ProfileField[] {
  return [
    { key: "photo", label: "Foto", filled: Boolean(pet.photo) },
    { key: "breed", label: "Raza", filled: Boolean(pet.breed) },
    { key: "gender", label: "Sexo", filled: Boolean(pet.gender) },
    { key: "birth_date", label: "Nacimiento", filled: Boolean(pet.birth_date) },
    { key: "food_type", label: "Tipo de alimento", filled: Boolean(pet.food_type) },
    { key: "food_brand", label: "Marca de alimento", filled: Boolean(pet.food_brand) },
    {
      key: "health_notes",
      label: "Notas de salud",
      filled: Boolean(pet.health_notes && pet.health_notes.trim().length > 0),
    },
    {
      key: "allergies",
      label: "Alergias",
      filled: Boolean(pet.allergies && pet.allergies.trim().length > 0),
    },
  ];
}

export function missingFieldLabels(pet: Pet): string[] {
  return profileFields(pet)
    .filter((f) => !f.filled)
    .map((f) => f.label);
}
