import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FormErrors } from "@/components/shared/FormErrors";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  consumeFirstPetPending,
  consumeSegmentationPending,
} from "@/lib/onboarding-flags";
import { useLogin } from "@/api/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { resetUserSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const authLogin = useAuthStore((s) => s.login);
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  // F-F.3: cuando el /setup nos redirige porque el magic-link
  // ya no sirve (usado/expirado/inválido), mostramos un banner
  // arriba del form explicando por qué el usuario aterrizó aquí.
  const setupNotice = getSetupNotice(searchParams.get("setup"));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      const result = await login.mutateAsync(data);
      // Defense-in-depth: if a previous session on this browser
      // wasn't cleanly ended (window closed without logout,
      // shared device, etc.), scrub any user-scoped cache/store
      // BEFORE seating the new user so their first render has
      // zero risk of showing the previous user's data.
      resetUserSession();
      authLogin(result.access, result.refresh, result.user);
      // Post-registration onboarding chain. Segmentation runs first
      // (short, sets tone for personalization); the survey page then
      // consumes the pet flag itself to continue on to /pets/new
      // after submit or skip. Subsequent logins fall through to the
      // `from` redirect (deep link) or /.
      if (consumeSegmentationPending()) {
        navigate("/onboarding/preferences", { replace: true });
        return;
      }
      if (consumeFirstPetPending()) {
        navigate("/pets/new", { replace: true });
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos iniciar sesión. Intenta de nuevo.");
    }
  }

  return (
    <AuthLayout
      title="Entra a tu cuenta"
      description="Gestiona a tu mascota y tus reservas"
      footer={
        <span>
          ¿Nuevo por aquí?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Crea tu cuenta
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {setupNotice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/10 dark:text-amber-100"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>{setupNotice}</p>
          </div>
        )}
        <FormErrors message={errors.root?.message} />

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Mapea el query param `?setup=` (usado/expirado/inválido)
 *  a un copy amable para el banner. Cualquier otro valor
 *  (o ausencia) → null y el banner no se renderiza. Fuente
 *  del slug: SetupPage.classifyTokenError. */
function getSetupNotice(raw: string | null): string | null {
  switch (raw) {
    case "used":
      return (
        "El link para completar tu cuenta ya fue usado. "
        + "Inicia sesión con la contraseña que elegiste."
      );
    case "expired":
      return (
        "El link para completar tu cuenta expiró. "
        + "Si ya lo usaste antes, entra aquí; si no, "
        + "pide a la sucursal que te envíe uno nuevo."
      );
    case "invalid":
      return (
        "El link para completar tu cuenta no es válido. "
        + "Si ya tienes cuenta, entra con tu contraseña; "
        + "si no, pide a la sucursal un nuevo link."
      );
    default:
      return null;
  }
}
