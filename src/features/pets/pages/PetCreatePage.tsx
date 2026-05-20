import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { BackLink } from "@/features/pets/components/BackLink";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import { useCreatePet } from "@/api/hooks/use-pets";
import { SPECIES_LABEL, GENDER_LABEL } from "@/types/pet";
import type { Species, Gender } from "@/types/pet";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  species: z.enum(["DOG", "CAT"], { message: "Selecciona una especie" }),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  breed: z.string().optional(),
  birth_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PetCreatePage() {
  const navigate = useNavigate();
  const create = useCreatePet();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      breed: "",
      birth_date: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        name: data.name,
        species: data.species as Species,
        ...(data.gender ? { gender: data.gender as Gender } : {}),
        ...(data.breed ? { breed: data.breed } : {}),
        ...(data.birth_date ? { birth_date: data.birth_date } : {}),
      };
      const pet = await create.mutateAsync(payload);
      toast.success(`${pet.name} quedó registrado. Ahora completa su perfil.`);
      navigate(`/pets/${pet.id}/edit`, { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos crear la mascota.");
    }
  }

  return (
    <div className="space-y-4">
      <BackLink to="/pets" label="Mis mascotas" />

      <Card>
        <CardHeader>
          <CardTitle>Nueva mascota</CardTitle>
          <CardDescription>
            Con el nombre y la especie basta para empezar. Luego podrás completar su perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormErrors message={errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="species">Especie</Label>
              <Controller
                control={control}
                name="species"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="species" className="w-full" aria-invalid={Boolean(errors.species)}>
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
                <p className="text-sm text-destructive">{errors.species.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Sexo</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Opcional" />
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Raza</Label>
              <Input
                id="breed"
                autoComplete="off"
                placeholder="Opcional"
                {...register("breed")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                {...register("birth_date")}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Crear mascota"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
