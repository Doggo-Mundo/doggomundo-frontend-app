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

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

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
    try {
      await resend.mutateAsync(email);
      toast.success("Te enviamos un nuevo código.");
    } catch {
      toast.error("No pudimos reenviar el código. Intenta de nuevo.");
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
