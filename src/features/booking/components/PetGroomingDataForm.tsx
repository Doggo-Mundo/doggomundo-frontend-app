import { useState, type FormEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdatePetComplete } from "@/api/hooks/use-pets";
import { cn } from "@/lib/utils";
import type { CoatType, UpdatePetCompletePayload } from "@/types/pet";

export type GroomingDataField = "weight" | "coat_type";

const MAX_WEIGHT_KG = 150;

const COAT_OPTIONS: { value: CoatType; label: string; help: string }[] = [
  {
    value: "SHORT",
    label: "Pelo corto",
    help: "Pegado al cuerpo (Chihuahua de pelo corto, Pug, Beagle, Labrador)",
  },
  {
    value: "LONG",
    label: "Pelo largo",
    help: "Largo, rizado o doble capa (Shih Tzu, Poodle, Schnauzer, Golden, Husky)",
  },
];

interface Props {
  petId: string;
  petName: string;
  /** Solo se piden los campos que le faltan a la mascota. */
  missing: GroomingDataField[];
  onSaved: () => void;
  onCancel: () => void;
}

/** "5.2" → "5.20"; null si no es un peso válido (> 0, ≤ 150, máx 2 decimales). */
function normalizeWeight(raw: string): string | null {
  const v = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  if (!(n > 0) || n > MAX_WEIGHT_KG) return null;
  return n.toFixed(2);
}

function extractApiError(err: unknown): string {
  const fallback = "No pudimos guardar los datos. Intenta de nuevo.";
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data as
    | Record<string, string[] | string | undefined>
    | undefined;
  if (!data || typeof data !== "object") return fallback;
  for (const key of ["weight", "coat_type", "detail", "error", "non_field_errors"]) {
    const val = data[key];
    if (val) return Array.isArray(val) ? String(val[0]) : String(val);
  }
  return fallback;
}

/**
 * Captura inline de peso y/o tipo de pelo en el paso de mascota, cuando
 * la cotización de un servicio de calculadora (tamaño × pelo) falla
 * porque al perfil le faltan esos datos. Evita mandar al cliente a
 * editar el perfil completo y perder el hilo del wizard.
 */
export function PetGroomingDataForm({
  petId,
  petName,
  missing,
  onSaved,
  onCancel,
}: Props) {
  const update = useUpdatePetComplete(petId);
  const askWeight = missing.includes("weight");
  const askCoat = missing.includes("coat_type");

  const [weight, setWeight] = useState("");
  const [coat, setCoat] = useState<CoatType | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [coatError, setCoatError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    const payload: UpdatePetCompletePayload = {};
    let valid = true;

    if (askWeight) {
      const normalized = normalizeWeight(weight);
      if (!normalized) {
        setWeightError(
          `Ingresa un peso válido en kg, mayor a 0 y hasta ${MAX_WEIGHT_KG} (ej. 12.5)`,
        );
        valid = false;
      } else {
        setWeightError(null);
        payload.weight = normalized;
      }
    }
    if (askCoat) {
      if (!coat) {
        setCoatError("Elige el tipo de pelo");
        valid = false;
      } else {
        setCoatError(null);
        payload.coat_type = coat;
      }
    }
    if (!valid) return;

    try {
      await update.mutateAsync(payload);
      onSaved();
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  return (
    <Card size="sm" className="border-primary/40">
      <form className="space-y-4 px-3" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <p className="font-medium">Cuéntanos un poco más de {petName}</p>
          <p className="text-xs text-muted-foreground">
            El precio y la duración del grooming dependen de su tamaño y
            tipo de pelo. Lo guardamos en su perfil para la próxima.
          </p>
        </div>

        {askWeight && (
          <div className="space-y-1.5">
            <Label htmlFor="grooming-weight">Peso (kg)</Label>
            <Input
              id="grooming-weight"
              type="number"
              step="0.1"
              min="0.1"
              max={MAX_WEIGHT_KG}
              inputMode="decimal"
              placeholder="Ej. 12.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-invalid={Boolean(weightError)}
              aria-describedby={weightError ? "grooming-weight-error" : undefined}
            />
            {weightError && (
              <p id="grooming-weight-error" className="text-sm text-destructive">
                {weightError}
              </p>
            )}
          </div>
        )}

        {askCoat && (
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Tipo de pelo</legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {COAT_OPTIONS.map((opt) => {
                const checked = coat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setCoat(opt.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      checked
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-primary/60",
                    )}
                  >
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {opt.help}
                    </span>
                  </button>
                );
              })}
            </div>
            {coatError && (
              <p className="text-sm text-destructive">{coatError}</p>
            )}
          </fieldset>
        )}

        {apiError && (
          <p className="text-sm text-destructive" role="alert">
            {apiError}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={update.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={update.isPending}>
            {update.isPending ? "Guardando…" : "Guardar y continuar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
