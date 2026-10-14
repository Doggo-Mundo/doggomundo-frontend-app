import { useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { FormErrors } from "@/components/shared/FormErrors";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  DEFAULT_RESEND_COOLDOWN_SECONDS,
  formatCountdown,
  getRetryAfterSeconds,
} from "@/features/auth/lib/resend-cooldown";
import { useCountdown } from "@/hooks/use-countdown";
import {
  markFirstPetPending,
  markSegmentationPending,
} from "@/lib/onboarding-flags";
import {
  useVerifyEmail,
  useResendVerificationOtp,
} from "@/api/hooks/use-auth";

const verifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Ingresa los 6 dígitos"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const verify = useVerifyEmail();
  const resend = useResendVerificationOtp();
  const { remaining, start } = useCountdown();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  // El registro ya mandó el primer código justo antes de llegar acá —
  // arranca el cooldown de una vez para que "Reenviar" no quede
  // disponible de inmediato.
  useEffect(() => {
    if (email) start(DEFAULT_RESEND_COOLDOWN_SECONDS);
  }, [email, start]);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  async function onSubmit(data: VerifyFormValues) {
    try {
      await verify.mutateAsync({ email, otp_code: data.otp });
      // First login flows through the onboarding chain:
      //   segmentation survey (2 min) → new pet form → home
      // Both flags cleared by consumers on their respective steps.
      markSegmentationPending();
      markFirstPetPending();
      toast.success("Tu email fue verificado. Ya puedes iniciar sesión.");
      navigate("/login", { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos verificar el código.", {
        fieldMap: { otp_code: "otp" },
        formFields: ["otp"],
      });
    }
  }

  async function handleResend() {
    if (remaining > 0 || resend.isPending) return;
    try {
      await resend.mutateAsync(email);
      toast.success("Te enviamos un nuevo código.");
      start(DEFAULT_RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const retryAfter = getRetryAfterSeconds(err);
      if (retryAfter !== null) {
        start(retryAfter);
        toast.error("Demasiados intentos. Espera antes de volver a pedir un código.");
      } else {
        toast.error("No pudimos reenviar el código. Intenta de nuevo.");
      }
    }
  }

  return (
    <AuthLayout
      title="Verifica tu email"
      description={`Enviamos un código a ${email}`}
      footer={
        <button
          type="button"
          onClick={handleResend}
          disabled={resend.isPending || remaining > 0}
          className="font-medium text-primary hover:underline disabled:opacity-60 disabled:no-underline"
        >
          {resend.isPending
            ? "Reenviando…"
            : remaining > 0
              ? `Reenviar código (${formatCountdown(remaining)})`
              : "Reenviar código"}
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

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verificando…" : "Verificar"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Email incorrecto?{" "}
          <Link to="/register" className="underline hover:text-foreground">
            Regístrate de nuevo
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
