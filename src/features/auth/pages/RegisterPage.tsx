import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { PawCheckbox } from "@/components/ui/paw-checkbox";
import { FormErrors } from "@/components/shared/FormErrors";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import { useLegalDocs, useRegister } from "@/api/hooks/use-auth";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "El nombre es requerido"),
    last_name: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Email inválido"),
    phone: z
      .string()
      .regex(/^\+?\d{10,15}$/, "Teléfono inválido (10–15 dígitos)"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string(),
    // F-G.2: 3 consentimientos required. Zod `literal(true)` es la
    // forma limpia de forzar "solo checked pasa". Msg específico
    // por doc para que aparezca a la altura del checkbox correcto.
    terms_accepted: z.literal(true, {
      errorMap: () => ({
        message: "Debes aceptar los términos y condiciones.",
      }),
    }),
    privacy_accepted: z.literal(true, {
      errorMap: () => ({
        message: "Debes aceptar el aviso de privacidad.",
      }),
    }),
    disclaimer_accepted: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar el disclaimer." }),
    }),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  // Docs legales para pintar el link "Ver …". Si el endpoint no
  // respondió aún, dejamos fallback estático a `/legal/*` para que
  // el usuario nunca vea link vacío.
  const legalDocs = useLegalDocs();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      password_confirm: "",
      terms_accepted: false as unknown as true,
      privacy_accepted: false as unknown as true,
      disclaimer_accepted: false as unknown as true,
    },
  });

  const termsUrl = legalDocs.data?.terms_and_conditions.url ?? "/legal/terms";
  const privacyUrl =
    legalDocs.data?.privacy_policy.url ?? "/legal/privacy";
  const disclaimerUrl =
    legalDocs.data?.disclaimer.url ?? "/legal/disclaimer";

  async function onSubmit(data: RegisterFormValues) {
    try {
      await registerMutation.mutateAsync(data);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        replace: true,
      });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos crear tu cuenta. Intenta de nuevo.");
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Te enviaremos un código al email para verificarla"
      footer={
        <span>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entra
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormErrors message={errors.root?.message} />

        <div className="grid grid-cols-2 gap-3">
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+5215512345678"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirm">Repite la contraseña</Label>
          <PasswordInput
            id="password_confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirm)}
            {...register("password_confirm")}
          />
          {errors.password_confirm && (
            <p className="text-sm text-destructive">
              {errors.password_confirm.message}
            </p>
          )}
        </div>

        {/* F-G.2: consentimientos legales. El email de verificación
            que sigue funciona como firma del consentimiento (usuario
            demuestra que controla el buzón que aceptó). */}
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <Controller
            control={control}
            name="terms_accepted"
            render={({ field }) => (
              <PawCheckbox
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                error={errors.terms_accepted?.message}
                label={
                  <>
                    He leído y acepto los{" "}
                    <a
                      href={termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Términos y condiciones
                    </a>
                    .
                  </>
                }
              />
            )}
          />
          <Controller
            control={control}
            name="privacy_accepted"
            render={({ field }) => (
              <PawCheckbox
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                error={errors.privacy_accepted?.message}
                label={
                  <>
                    He leído y acepto el{" "}
                    <a
                      href={privacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Aviso de privacidad
                    </a>
                    .
                  </>
                }
              />
            )}
          />
          <Controller
            control={control}
            name="disclaimer_accepted"
            render={({ field }) => (
              <PawCheckbox
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                error={errors.disclaimer_accepted?.message}
                label={
                  <>
                    Entiendo el{" "}
                    <a
                      href={disclaimerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Disclaimer
                    </a>{" "}
                    (Doggo Mundo no sustituye consejo veterinario).
                  </>
                }
              />
            )}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
