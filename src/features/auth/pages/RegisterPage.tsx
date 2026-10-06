import { useEffect } from "react";
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
import { PhoneFields } from "@/components/shared/PhoneFields";
import { DEFAULT_COUNTRY_CODE } from "@/data/country-codes";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import { useLegalDocs, useRegister } from "@/api/hooks/use-auth";
import {
  PACK_CODE_SIGNATURE_KEY,
  PACK_CODE_SIGNED_EVENT,
  clearStoredSignature,
  readStoredSignature,
} from "@/features/legal/pack-code-signature";

/** Mensaje que emite PackCodePage al cerrar por firma exitosa —
 *  el tab padre (register/setup) lo escucha para marcar la
 *  huellita como aceptada. */
const PACK_CODE_SIGNED_MESSAGE = "pack-code-signed";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "El nombre es requerido"),
    last_name: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Email inválido"),
    phone_country_code: z.string().min(1, "Selecciona un país"),
    phone: z
      .string()
      .regex(/^\d{10,15}$/, "Teléfono inválido (10–15 dígitos)"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string(),
    // F-G.2 + F-G.4: 4 consentimientos required. Zod `literal(true)`
    // es la forma limpia de forzar "solo checked pasa". Msg
    // específico por doc para que aparezca a la altura del checkbox
    // correcto.
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
    pack_code_accepted: z.literal(true, {
      errorMap: () => ({
        message: "Debes aceptar el Código de la Manada.",
      }),
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_country_code: DEFAULT_COUNTRY_CODE,
      phone: "",
      password: "",
      password_confirm: "",
      terms_accepted: false as unknown as true,
      privacy_accepted: false as unknown as true,
      disclaimer_accepted: false as unknown as true,
      pack_code_accepted: false as unknown as true,
    },
  });

  const termsUrl = legalDocs.data?.terms_and_conditions.url ?? "/legal/terms";
  const privacyUrl =
    legalDocs.data?.privacy_policy.url ?? "/legal/privacy";
  const disclaimerUrl =
    legalDocs.data?.disclaimer.url ?? "/legal/disclaimer";
  const packCodeBaseUrl =
    legalDocs.data?.code_of_the_pack.url ?? "/legal/codigo-de-la-manada";

  // Pack code se firma en pestaña aparte. Tres canales de detección
  // (belt-and-suspenders para que el checkbox NUNCA quede stuck):
  //  1) `message` (postMessage del tab que firmó, cuando hay opener)
  //  2) `storage` (localStorage sync entre pestañas del mismo origin)
  //  3) `PACK_CODE_SIGNED_EVENT` (CustomEvent local — cubre el caso
  //     raro de que firma y register vivan en el mismo tab)
  // Y en el mount, si el user ya firmó en otro momento
  // (localStorage persiste), arrancamos con el checkbox marcado.
  const packCodeSigned = watch("pack_code_accepted");
  useEffect(() => {
    const markSigned = () =>
      setValue("pack_code_accepted", true as unknown as true, {
        shouldValidate: true,
        shouldDirty: true,
      });

    // Rehidratar del localStorage en el mount.
    if (readStoredSignature()) markSigned();

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | undefined;
      if (data?.type === PACK_CODE_SIGNED_MESSAGE) markSigned();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PACK_CODE_SIGNATURE_KEY) return;
      if (event.newValue) markSigned();
    };
    const onCustom = () => markSigned();

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    window.addEventListener(PACK_CODE_SIGNED_EVENT, onCustom);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PACK_CODE_SIGNED_EVENT, onCustom);
    };
  }, [setValue]);

  // Pre-llena los datos del sign form del pack code con lo que ya
  // escribió el usuario en el register — evita re-tipear nombre y
  // teléfono en la pestaña de firma.
  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const phoneCountryCode = watch("phone_country_code");
  const phone = watch("phone");
  const packCodeUrl = (() => {
    const params = new URLSearchParams();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (name) params.set("name", name);
    if (phone) {
      params.set("phone_country_code", phoneCountryCode);
      params.set("phone", phone);
    }
    const query = params.toString();
    return query ? `${packCodeBaseUrl}?${query}` : packCodeBaseUrl;
  })();

  async function onSubmit(data: RegisterFormValues) {
    try {
      await registerMutation.mutateAsync(data);
      // El backend ya creó el `LegalAcceptance` con el audit trail
      // completo — el estado UI en localStorage ya no aporta y
      // podría confundir a otro usuario en el mismo dispositivo.
      clearStoredSignature();
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

        <PhoneFields
          control={control}
          register={register}
          countryCodeName="phone_country_code"
          phoneName="phone"
          countryCodeError={errors.phone_country_code?.message}
          phoneError={errors.phone?.message}
        />

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
          {/* F-G.4: el pack code no se puede marcar directo — el
              usuario TIENE que abrir la pestaña de firma, llenar
              sus datos y firmar. Al firmar, esa pestaña emite
              postMessage y este useEffect marca el checkbox como
              aceptado.

              Wrapper con tinte coral (y borde punteado cuando no
              ha firmado) para llamar la atención: no es un
              checkbox más — hay que ir a otra página. */}
          <div
            className={
              packCodeSigned
                ? "rounded-md bg-primary/10 px-2 py-1.5 ring-1 ring-primary/30 transition-colors"
                : "rounded-md bg-accent/15 px-2 py-1.5 ring-1 ring-accent/50 ring-dashed transition-colors"
            }
          >
            <Controller
              control={control}
              name="pack_code_accepted"
              render={({ field }) => (
                <PawCheckbox
                  checked={Boolean(field.value)}
                  disabled
                  readOnly
                  onChange={() => {
                    /* no-op: solo se marca vía la firma en la pestaña
                       nueva; ver onClick del link "Firmar" abajo. */
                  }}
                  error={errors.pack_code_accepted?.message}
                  label={
                    packCodeSigned ? (
                      <span>
                        <strong>Firmaste</strong> el{" "}
                        <a
                          href={packCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          Código de la Manada
                        </a>
                        . ¡Bienvenido a la manada!
                      </span>
                    ) : (
                      <span>
                        Debes{" "}
                        <a
                          href={packCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary underline underline-offset-2"
                        >
                          firmar el Código de la Manada
                        </a>
                        . Se abre en otra pestaña.
                      </span>
                    )
                  }
                />
              )}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
