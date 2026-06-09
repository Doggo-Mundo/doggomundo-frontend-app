import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormErrors } from "@/components/shared/FormErrors";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  useResetPassword,
  useResendPasswordResetOtp,
} from "@/api/hooks/use-auth";

const schema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, "Ingresa los 6 dígitos"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const reset = useResetPassword();
  const resend = useResendPasswordResetOtp();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "", password: "", password_confirm: "" },
  });

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function onSubmit(data: FormValues) {
    try {
      await reset.mutateAsync({
        email,
        otp_code: data.otp,
        new_password: data.password,
        new_password_confirm: data.password_confirm,
      });
      toast.success("Tu contraseña fue actualizada. Ya puedes iniciar sesión.");
      navigate("/login", { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos actualizar la contraseña.", {
        fieldMap: {
          otp_code: "otp",
          new_password: "password",
          new_password_confirm: "password_confirm",
        },
        formFields: ["otp", "password", "password_confirm"],
      });
    }
  }

  async function handleResend() {
    try {
      await resend.mutateAsync(email);
      toast.success("Te enviamos un nuevo código.");
    } catch {
      toast.error("No pudimos reenviar el código. Intenta de nuevo.");
    }
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      description={`Enviamos un código a ${email}`}
      footer={
        <button
          type="button"
          onClick={handleResend}
          disabled={resend.isPending}
          className="font-medium text-primary hover:underline disabled:opacity-60"
        >
          {resend.isPending ? "Reenviando…" : "Reenviar código"}
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormErrors message={errors.root?.message} />

        <div className="space-y-1.5">
          <Label htmlFor="otp">Código</Label>
          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <OtpInput
                id="otp"
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.otp)}
                autoFocus
              />
            )}
          />
          {errors.otp && (
            <p className="text-sm text-destructive">{errors.otp.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ¿No te llegó? Revisa también la carpeta de spam o correo no deseado.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
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

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Actualizar contraseña"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="underline hover:text-foreground">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
