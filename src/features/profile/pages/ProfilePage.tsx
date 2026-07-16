import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Camera,
  PawPrint,
  Receipt,
  Crown,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import { useMySegmentation } from "@/api/hooks/use-segmentation";
import { ARCHETYPE_LABEL } from "@/types/segmentation";
import { MyDaycareSection } from "@/features/daycare/components/MyDaycareSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { LoadingState } from "@/components/shared/LoadingState";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useMe, useUpdateMe, useUpdateMyPhoto } from "@/api/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Teléfono inválido (10–15 dígitos)"),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const { data: user, isLoading } = useMe();
  const update = useUpdateMe();
  const updatePhoto = useUpdateMyPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: segmentation } = useMySegmentation();
  const current = user ?? storeUser;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: current?.first_name ?? "",
      last_name: current?.last_name ?? "",
      phone: current?.phone ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      });
    }
  }, [user, reset]);

  async function onSubmit(data: FormValues) {
    try {
      await update.mutateAsync(data);
      toast.success("Tus datos se actualizaron.");
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos guardar los cambios.");
    }
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error("La imagen es muy grande. Máximo 5 MB.");
      return;
    }
    try {
      await updatePhoto.mutateAsync(file);
      toast.success("Foto actualizada.");
    } catch {
      toast.error("No pudimos subir la foto. Intenta de nuevo.");
    }
  }

  if (isLoading && !current) {
    return <LoadingState rows={3} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="relative shrink-0">
          <UserAvatar
            name={current?.full_name ?? current?.first_name ?? "?"}
            photo={current?.photo ?? null}
            size="lg"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={updatePhoto.isPending}
            className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
            aria-label="Cambiar foto"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFile}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="truncate text-2xl font-semibold">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">
            Datos de tu cuenta Doggo Mundo.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>El email solo puede cambiarse contactando a soporte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormErrors message={errors.root?.message} />

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={current?.email ?? ""} disabled readOnly />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {current?.email_verified ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Verificado
                  </>
                ) : (
                  <>
                    <Circle className="h-3.5 w-3.5" />
                    Sin verificar
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.first_name)}
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.last_name)}
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+5215512345678"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Mis preferencias
          </CardTitle>
          <CardDescription>
            {segmentation
              ? "Personalizamos tu experiencia con base en tus respuestas. Puedes actualizarlas cuando quieras."
              : "Cuéntanos sobre ti y tu perro (2 min) para personalizar tu experiencia."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {segmentation && segmentation.primary_archetypes.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Tu perfil actual
              </p>
              <p className="mt-0.5 font-medium">
                {segmentation.primary_archetypes
                  .map((c) => ARCHETYPE_LABEL[c])
                  .join(" · ")}
              </p>
            </div>
          )}
          <Button
            asChild
            variant={segmentation ? "outline" : "default"}
            className="w-full justify-between"
          >
            <Link to="/onboarding/preferences">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {segmentation
                  ? "Actualizar mis respuestas"
                  : "Empezar cuestionario"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <MyDaycareSection />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accesos</CardTitle>
          <CardDescription>Tus mascotas, pagos y más.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/pets">
              <span className="flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                Mis mascotas
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/my/orders">
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Mis órdenes
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/my/subscriptions">
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Mis suscripciones
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/payment-methods">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Métodos de pago
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
