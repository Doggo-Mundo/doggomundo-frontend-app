import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  usePet,
  useUpdatePetBasic,
  useUpdatePetComplete,
} from "@/api/hooks/use-pets";
import {
  SPECIES_LABEL,
  GENDER_LABEL,
  SIZE_LABEL,
} from "@/types/pet";
import type { Pet, Species, Gender, PetSize } from "@/types/pet";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  species: z.enum(["DOG", "CAT"]),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "X_LARGE"]).optional(),
  weight: z.string().optional(),
  microchip_id: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{15}$/.test(v),
      "El microchip debe tener exactamente 15 dígitos",
    ),
  health_notes: z.string().optional(),
  allergies: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const BASIC_KEYS = [
  "name",
  "species",
  "gender",
  "breed",
  "birth_date",
] as const satisfies readonly (keyof FormValues)[];

const COMPLETE_KEYS = [
  "size",
  "weight",
  "microchip_id",
  "health_notes",
  "allergies",
] as const satisfies readonly (keyof FormValues)[];

export function PetEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pet, isLoading, isError } = usePet(id ?? "");

  if (!id) return <Navigate to="/pets" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to={`/pets/${id}`} label="Volver" />
        <LoadingState rows={4} />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="space-y-4">
        <BackLink to="/pets" label="Mis mascotas" />
        <EmptyState title="No pudimos cargar esta mascota" />
      </div>
    );
  }

  // Once the pet has loaded we mount the form with real defaults. Remounting
  // by id avoids Radix `Select` getting stuck in uncontrolled mode when the
  // initial value arrives async.
  return <PetEditForm key={pet.id} pet={pet} />;
}

interface FormProps {
  pet: Pet;
}

function PetEditForm({ pet }: FormProps) {
  const navigate = useNavigate();
  const updateBasic = useUpdatePetBasic(pet.id);
  const updateComplete = useUpdatePetComplete(pet.id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pet.name,
      species: pet.species ?? undefined,
      gender: pet.gender ?? undefined,
      breed: pet.breed ?? "",
      birth_date: pet.birth_date ?? "",
      size: pet.size ?? undefined,
      weight: pet.weight ?? "",
      microchip_id: pet.microchip_id ?? "",
      health_notes: pet.health_notes ?? "",
      allergies: pet.allergies ?? "",
    },
  });

  async function onSubmit(data: FormValues) {
    const basicChanges: Record<string, unknown> = {};
    BASIC_KEYS.forEach((k) => {
      if (dirtyFields[k]) basicChanges[k] = data[k] ?? "";
    });

    const completeChanges: Record<string, unknown> = {};
    COMPLETE_KEYS.forEach((k) => {
      if (dirtyFields[k]) completeChanges[k] = data[k] ?? "";
    });

    if (
      Object.keys(basicChanges).length === 0 &&
      Object.keys(completeChanges).length === 0
    ) {
      toast.info("No has hecho cambios.");
      return;
    }

    try {
      if (Object.keys(basicChanges).length > 0) {
        await updateBasic.mutateAsync(basicChanges);
      }
      if (Object.keys(completeChanges).length > 0) {
        await updateComplete.mutateAsync(completeChanges);
      }
      toast.success("Perfil actualizado.");
      navigate(`/pets/${pet.id}`, { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos guardar los cambios.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to={`/pets/${pet.id}`} label={pet.name} />

      <header>
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          Perfil al {pet.onboarding_completion_percentage}%. Completa lo que te falte.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormErrors message={errors.root?.message} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="species">Especie</Label>
                <Controller
                  control={control}
                  name="species"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="species" className="w-full">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(SPECIES_LABEL) as Species[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {SPECIES_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.species && (
                  <p className="text-sm text-destructive">
                    {errors.species.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Sexo</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                          <SelectItem key={g} value={g}>
                            {GENDER_LABEL[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className="text-sm text-destructive">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raza</Label>
              <Input id="breed" {...register("breed")} />
              {errors.breed && (
                <p className="text-sm text-destructive">
                  {errors.breed.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-sm text-destructive">
                  {errors.birth_date.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="size">Tamaño</Label>
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="size" className="w-full">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(SIZE_LABEL) as PetSize[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {SIZE_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.size && (
                  <p className="text-sm text-destructive">
                    {errors.size.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  {...register("weight")}
                />
                {errors.weight && (
                  <p className="text-sm text-destructive">
                    {errors.weight.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="microchip_id">Microchip</Label>
              <Input id="microchip_id" {...register("microchip_id")} />
              {errors.microchip_id && (
                <p className="text-sm text-destructive">
                  {errors.microchip_id.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="health_notes">Notas de salud</Label>
              <Textarea
                id="health_notes"
                rows={3}
                placeholder="Condiciones, medicamentos, etc."
                {...register("health_notes")}
              />
              {errors.health_notes && (
                <p className="text-sm text-destructive">
                  {errors.health_notes.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                rows={2}
                placeholder="Alimentos, medicamentos, etc."
                {...register("allergies")}
              />
              {errors.allergies && (
                <p className="text-sm text-destructive">
                  {errors.allergies.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting
            ? "Guardando…"
            : isDirty
              ? "Guardar cambios"
              : "Sin cambios por guardar"}
        </Button>
      </form>
    </div>
  );
}
