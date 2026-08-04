import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import {
  Camera, CheckCircle2, ChevronRight, FileText,
  Loader2, ShieldCheck, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { FormErrors } from "@/components/shared/FormErrors";
import { useWalkInSetup } from "@/api/hooks/use-auth";
import { useUploadPetDocument } from "@/api/hooks/use-pets";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

/**
 * F-F.3: página que consume el magic-link del email. Flow:
 *
 *   Step 1 (password) → llama POST /api/auth/setup/. Al éxito
 *     hidrata el auth store (autologin) y avanza.
 *   Step 2 (cartilla) → sube la foto/PDF como MedicalDocument
 *     con document_type=CARTILLA_VACUNACION al pet creado por el
 *     staff. Cliente puede skippear con "Más tarde" — quedará
 *     con un warning soft en cualquier cita que reserve.
 *   Step 3 (done)   → CTA a Home.
 *
 * Sin AuthGuard: la ruta vive fuera del wrapper protegido para
 * que el cliente pueda entrar desde el email sin sesión.
 */
export function SetupPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const [step, setStep] = useState<"password" | "cartilla" | "done">("password");
  const [petId, setPetId] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <h1 className="text-2xl font-semibold">Link inválido</h1>
        <p className="text-sm text-muted-foreground">
          El link para completar tu cuenta no trae un token válido.
          Pide a la sucursal que te envíe uno nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <StepIndicator step={step} />
      {step === "password" && (
        <PasswordStep
          token={token}
          onComplete={(access, refresh, user, newPetId) => {
            authLogin(access, refresh, user);
            setPetId(newPetId);
            setStep("cartilla");
          }}
        />
      )}
      {step === "cartilla" && (
        <CartillaStep
          petId={petId}
          onDone={() => setStep("done")}
        />
      )}
      {step === "done" && (
        <DoneStep onGoHome={() => navigate("/", { replace: true })} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

interface IndicatorProps {
  step: "password" | "cartilla" | "done";
}

function StepIndicator({ step }: IndicatorProps) {
  const items = useMemo(
    () => [
      { key: "password", label: "Contraseña" },
      { key: "cartilla", label: "Cartilla" },
      { key: "done", label: "Listo" },
    ] as const,
    [],
  );
  const currentIdx = items.findIndex((i) => i.key === step);
  return (
    <ol className="flex items-center gap-1 text-[11px]">
      {items.map((item, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <li key={item.key} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                isDone && "bg-primary text-primary-foreground",
                isActive && "bg-primary/20 text-primary ring-2 ring-primary",
                !isDone && !isActive && "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
            </div>
            <span
              className={cn(
                "truncate",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
            {idx < items.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Step 1: password
// ---------------------------------------------------------------------------

const passwordSchema = z
  .object({
    password: z.string().min(8, "Al menos 8 caracteres"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

interface PasswordProps {
  token: string;
  onComplete: (
    access: string,
    refresh: string,
    user: import("@/types/user").User,
    petId: string | null,
  ) => void;
}

function PasswordStep({ token, onComplete }: PasswordProps) {
  const setup = useWalkInSetup();
  const {
    register, handleSubmit, setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", password_confirm: "" },
  });

  async function onSubmit(data: PasswordValues) {
    try {
      const r = await setup.mutateAsync({
        token,
        password: data.password,
        password_confirm: data.password_confirm,
      });
      onComplete(r.access, r.refresh, r.user, r.pet_id);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const detail = err.response.data?.detail;
        if (typeof detail === "string") {
          setError("root", { message: detail });
          return;
        }
        setError("root", { message: "No pudimos completar tu registro." });
      } else {
        setError("root", { message: "Error inesperado. Reintenta en unos segundos." });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Elige tu contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormErrors message={errors.root?.message} />

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirm">Confirma contraseña</Label>
            <Input
              id="password_confirm"
              type="password"
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
            {isSubmitting ? "Configurando…" : "Continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 2: cartilla
// ---------------------------------------------------------------------------

interface CartillaProps {
  petId: string | null;
  onDone: () => void;
}

function CartillaStep({ petId, onDone }: CartillaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  // useUploadPetDocument no puede ser condicional (rules-of-hooks).
  // Cuando petId es null (edge de datos inconsistentes: setup sin
  // pet asociado), el mutation no se dispara porque el guard de
  // handleUpload bloquea, y el string vacío nunca llega al fetch.
  const upload = useUploadPetDocument(petId ?? "");
  const canUpload = !!petId && !!file && !upload.isPending;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 10 MB.");
      return;
    }
    setFile(f);
  }

  async function handleUpload() {
    if (!file || !petId) return;
    try {
      await upload.mutateAsync({
        document_type: "CARTILLA_VACUNACION",
        file,
        description: "Cartilla subida al completar mi cuenta",
      });
      toast.success("¡Cartilla subida! Nuestro equipo la revisará.");
      onDone();
    } catch {
      toast.error("No pudimos subir la cartilla. Intenta otra vez.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-4 w-4 text-primary" />
          Cartilla de vacunación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Toma una foto de la cartilla completa (o sube un PDF si la
          tienes escaneada). La necesitamos al día para cualquier
          servicio — así protegemos a todos los peludos.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-20 flex-col gap-1"
            onClick={() => {
              // capture=environment activa la cámara trasera en
              // móviles; en desktop igual abre el file picker.
              if (inputRef.current) {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.click();
              }
            }}
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Tomar foto</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-20 flex-col gap-1"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute("capture");
                inputRef.current.click();
              }
            }}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">Subir archivo</span>
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handlePick}
        />

        {file && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            size="lg"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo…
              </>
            ) : (
              "Subir cartilla"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={upload.isPending}
          >
            Más tarde
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 3: done
// ---------------------------------------------------------------------------

interface DoneProps {
  onGoHome: () => void;
}

function DoneStep({ onGoHome }: DoneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ¡Bienvenido a Doggo Mundo!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tu cuenta ya está lista. Desde ahora puedes reservar
          servicios, ver el historial de tu peludo, comprar en la
          tienda y más.
        </p>
        <Button size="lg" className="w-full" onClick={onGoHome}>
          Ir al inicio
        </Button>
      </CardContent>
    </Card>
  );
}
