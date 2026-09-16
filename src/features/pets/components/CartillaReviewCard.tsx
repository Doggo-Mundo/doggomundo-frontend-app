import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toLocalDateISO } from "@/lib/format-date";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
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
import {
  useConfirmCartilla,
  usePetDocument,
  useRetryExtraction,
} from "@/api/hooks/use-pets";
import { CartillaUploader } from "@/features/pets/components/CartillaUploader";
import {
  VACCINE_TYPE_LABEL,
  type PetDocument,
  type VaccineType,
  type VlmExtractedVaccine,
  type VlmRawExtraction,
} from "@/types/pet";

const VACCINE_TYPES: VaccineType[] = [
  "RABIA",
  "MOQUILLO",
  "PARVOVIRUS",
  "LEPTOSPIROSIS",
  "BORDETELLA",
  "HEPATITIS",
  "PARAINFLUENZA",
  "TRIPLE_FELINA",
  "LEUCEMIA_FELINA",
  "OTRO",
];

const vaccineSchema = z
  .object({
    vaccine_name: z.string().min(1, "Requerido"),
    vaccine_type: z.enum(VACCINE_TYPES as [VaccineType, ...VaccineType[]]),
    administered_date: z
      .string()
      .min(1, "Requerido")
      .refine(
        // F-I #7: comparar strings YYYY-MM-DD en local MX evita el
        // bug de TZ: `new Date("2026-08-20")` se parsea UTC
        // medianoche y en MX quedaba 21hs del día anterior —
        // dependiendo de la hora dejaba pasar futuros o
        // rechazaba válidos.
        (v) => v <= toLocalDateISO(new Date()),
        "No puede ser fecha futura.",
      ),
    next_due_date: z.string().optional().or(z.literal("")),
    vet_name: z.string().optional().or(z.literal("")),
    vet_clinic: z.string().optional().or(z.literal("")),
    batch_number: z.string().optional().or(z.literal("")),
    _confidence: z.string().optional(),
  })
  .refine(
    (v) => {
      if (!v.next_due_date) return true;
      return new Date(v.next_due_date) >= new Date(v.administered_date);
    },
    {
      path: ["next_due_date"],
      message: "Debe ser posterior a la fecha de aplicación.",
    },
  );

const schema = z.object({
  vaccinations: z
    .array(vaccineSchema)
    .min(1, "Al menos una vacuna."),
});

type FormValues = z.infer<typeof schema>;

interface CartillaReviewCardProps {
  petId: string;
  /** Cartilla más reciente del pet (o null si nunca subió). */
  latestCartilla: PetDocument | null;
}

/** F-I: bloque unificado que vive arriba de VaccinationsPage.
 *
 *  Estados y qué renderiza:
 *  - Sin cartilla o última en CONFIRMED → uploader compacto para
 *    subir una nueva (frente + reverso + hojas extra).
 *  - PENDING/PROCESSING → tarjeta con spinner "leyendo cartilla".
 *  - EXTRACTED → form editable con las vacunas prellenadas por el
 *    VLM. Botón "Guardar y confirmar" al pie.
 *  - FAILED → banner rojo con retry inline + entrada manual como
 *    fallback (mismo form vacío).
 *
 *  Al confirmar, invalida el query key de vaccinations y las vacunas
 *  guardadas aparecen inmediatamente en la lista de la página. */
export function CartillaReviewCard({
  petId,
  latestCartilla,
}: CartillaReviewCardProps) {
  const docId = latestCartilla?.id ?? "";
  // Polling activo mientras el pipeline esté corriendo.
  const shouldPoll =
    latestCartilla?.vlm_extraction_status === "PENDING" ||
    latestCartilla?.vlm_extraction_status === "PROCESSING";
  const { data: doc } = usePetDocument(petId, docId, { poll: shouldPoll });

  const effective = doc ?? latestCartilla;
  // F-I #8: si el cliente ya confirmó, seguimos permitiendo editar
  // desde el mismo ReviewForm (usa confirmed_vaccinations como
  // seed). El "modo edit" se activa con un botón en el banner; por
  // default queda oculto para no distraer.
  const [editingConfirmed, setEditingConfirmed] = useState(false);

  if (!effective) {
    return <CartillaUploader petId={petId} />;
  }

  if (
    effective.vlm_extraction_status === "CONFIRMED" &&
    !editingConfirmed
  ) {
    return (
      <div className="space-y-4">
        <ConfirmedBanner onEdit={() => setEditingConfirmed(true)} />
        <CartillaUploader petId={petId} />
      </div>
    );
  }

  const status = effective.vlm_extraction_status;

  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Leyendo tu cartilla…</p>
            <p className="text-xs text-muted-foreground">
              Esto suele tomar unos segundos. En cuanto termine aparecerán
              las vacunas para que las revises.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // NOT_APPLICABLE no debería ocurrir para cartillas. CONFIRMED
  // llega aquí solo cuando el usuario hizo click en "Editar
  // vacunas" (editingConfirmed=true); en ese caso queremos el
  // ReviewForm — no el uploader — para que pueda corregir.
  if (
    status !== "EXTRACTED" &&
    status !== "FAILED" &&
    status !== "MANUAL" &&
    status !== "CONFIRMED"
  ) {
    return <CartillaUploader petId={petId} />;
  }

  return (
    <ReviewForm
      petId={petId}
      docId={effective.id}
      doc={effective}
      status={status}
    />
  );
}

function ConfirmedBanner({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          Tus vacunas están registradas. Puedes corregirlas o subir
          una cartilla más reciente.
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={onEdit}
      >
        Editar vacunas
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ReviewFormProps {
  petId: string;
  docId: string;
  doc: PetDocument;
  status: "EXTRACTED" | "FAILED" | "MANUAL" | "CONFIRMED";
}

function ReviewForm({ petId, docId, doc, status }: ReviewFormProps) {
  const retry = useRetryExtraction(petId, docId);
  const confirm = useConfirmCartilla(petId, docId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vaccinations: [emptyVaccine()] },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "vaccinations",
  });

  // F-I: sembramos el form UNA sola vez por doc. Antes usábamos
  // isDirty como guarda, pero cualquier re-render podía volver a
  // meter el effect y pisar la edición del usuario — se veía como
  // fechas que "regresaban solas" al valor extraído por VLM.
  const seededDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!doc) return;
    if (seededDocIdRef.current === doc.id) return;
    seededDocIdRef.current = doc.id;
    // F-I: si ya hay confirmed_vaccinations, esas son las ediciones
    // del cliente. vlm_raw_extraction tiene los datos originales
    // del VLM (immutable). Volver a mostrar el original después de
    // confirmar era el bug de "fechas que se resetean".
    const confirmed = doc.confirmed_vaccinations ?? [];
    const seeds =
      confirmed.length > 0
        ? seedFromConfirmed(confirmed)
        : seedFromVlm(doc.vlm_raw_extraction);
    replace(seeds.length ? seeds : [emptyVaccine()]);
  }, [doc, replace]);

  const onSubmit = (values: FormValues) => {
    confirm.mutate(
      {
        vaccinations: values.vaccinations.map((v) => ({
          vaccine_name: v.vaccine_name,
          vaccine_type: v.vaccine_type,
          administered_date: v.administered_date,
          next_due_date: v.next_due_date || null,
          vet_name: v.vet_name || undefined,
          vet_clinic: v.vet_clinic || undefined,
          batch_number: v.batch_number || undefined,
        })),
        // F-I #6: optimistic locking. Si el staff editó desde que
        // este form se cargó, backend responde 409 y le pedimos al
        // usuario recargar en vez de pisar los cambios ajenos.
        expected_updated_at: doc.updated_at,
      },
      {
        onSuccess: () => {
          toast.success("Vacunas guardadas");
          form.reset({ vaccinations: [emptyVaccine()] });
        },
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })
            ?.response?.status;
          if (status === 409) {
            toast.error(
              "Alguien del equipo actualizó tu cartilla. Recarga la pantalla.",
            );
          } else {
            toast.error("No pudimos guardar. Intenta de nuevo.");
          }
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {status === "EXTRACTED"
            ? "Revisa tus vacunas"
            : status === "FAILED"
            ? "Registra tus vacunas"
            : status === "CONFIRMED"
            ? "Edita tus vacunas"
            : "Vacunas de la cartilla"}
        </CardTitle>
        <CardDescription>
          {status === "EXTRACTED"
            ? "Ya leímos tu cartilla. Ajusta lo que haga falta y guarda."
            : status === "FAILED"
            ? "No pudimos leer la cartilla. Puedes reintentar o digitar las vacunas aquí."
            : status === "CONFIRMED"
            ? "Modifica lo que necesites; guardar sobrescribe la lista actual."
            : "Digitadas desde la cartilla."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "FAILED" && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 space-y-2">
              <p>Extracción automática falló.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={retry.isPending}
                onClick={() => retry.mutate()}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                {retry.isPending ? "Reintentando…" : "Reintentar lectura"}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {fields.map((field, index) => (
            <VaccineRow
              key={field.id}
              index={index}
              form={form}
              onRemove={fields.length > 1 ? () => remove(index) : null}
            />
          ))}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyVaccine())}
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar otra vacuna
            </Button>
            <div className="flex-1" />
            <Button type="submit" disabled={confirm.isPending}>
              {confirm.isPending ? "Guardando…" : "Guardar vacunas"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

interface VaccineRowProps {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onRemove: (() => void) | null;
}

function VaccineRow({ index, form, onRemove }: VaccineRowProps) {
  const confidence: string | undefined = form.watch(
    `vaccinations.${index}._confidence`,
  );
  const errors = form.formState.errors?.vaccinations?.[index];

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Vacuna {index + 1}
          </span>
          {confidence && <ConfidenceBadge value={confidence} />}
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Quitar"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>Nombre en la etiqueta</Label>
          <Input
            {...form.register(`vaccinations.${index}.vaccine_name`)}
            placeholder="p. ej. Vanguard Plus 5 L4 CV"
          />
          {errors?.vaccine_name && (
            <p className="text-xs text-rose-700">
              {errors.vaccine_name.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Controller
            control={form.control}
            name={`vaccinations.${index}.vaccine_type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VACCINE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {VACCINE_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label>Fecha de aplicación</Label>
          <Input
            type="date"
            {...form.register(`vaccinations.${index}.administered_date`)}
          />
          {errors?.administered_date && (
            <p className="text-xs text-rose-700">
              {errors.administered_date.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Próximo refuerzo</Label>
          <Input
            type="date"
            {...form.register(`vaccinations.${index}.next_due_date`)}
          />
          {errors?.next_due_date && (
            <p className="text-xs text-rose-700">
              {errors.next_due_date.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Veterinario (opcional)</Label>
          <Input {...form.register(`vaccinations.${index}.vet_name`)} />
        </div>
        <div className="space-y-1">
          <Label>Clínica (opcional)</Label>
          <Input {...form.register(`vaccinations.${index}.vet_clinic`)} />
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const cfg =
    normalized === "alta"
      ? { label: "Confianza alta", cls: "bg-emerald-100 text-emerald-800" }
      : normalized === "media"
      ? { label: "Confianza media", cls: "bg-amber-100 text-amber-800" }
      : { label: "Confianza baja", cls: "bg-rose-100 text-rose-800" };
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-[10px] font-medium " + cfg.cls
      }
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------

function emptyVaccine() {
  return {
    vaccine_name: "",
    vaccine_type: "OTRO" as VaccineType,
    administered_date: "",
    next_due_date: "",
    vet_name: "",
    vet_clinic: "",
    batch_number: "",
    _confidence: "",
  };
}

function seedFromVlm(raw: VlmRawExtraction | null) {
  if (!raw?.vacunas?.length) return [];
  return raw.vacunas.map((v) => ({
    vaccine_name: v.nombre_crudo ?? "",
    vaccine_type: normalizeVaccineType(v),
    administered_date: v.fecha_aplicacion ?? "",
    next_due_date: v.proxima_dosis ?? "",
    vet_name: "",
    vet_clinic: "",
    batch_number: "",
    _confidence: v.confianza ?? "",
  }));
}

/** F-I: seed desde las vacunas ya confirmadas — la fuente de verdad
 *  post-CONFIRMED. Sin este orden reabrir el form pisaba edits del
 *  usuario con los datos originales del VLM. */
function seedFromConfirmed(
  rows: NonNullable<PetDocument["confirmed_vaccinations"]>,
) {
  return rows.map((r) => ({
    vaccine_name: r.vaccine_name,
    vaccine_type: (r.vaccine_type as VaccineType) ?? "OTRO",
    administered_date: r.administered_date ?? "",
    next_due_date: r.next_due_date ?? "",
    vet_name: r.vet_name ?? "",
    vet_clinic: r.vet_clinic ?? "",
    batch_number: r.batch_number ?? "",
    _confidence: "",
  }));
}

function normalizeVaccineType(v: VlmExtractedVaccine): VaccineType {
  const raw = (v.tipo ?? v.categoria ?? "").toLowerCase();
  if (raw.includes("rabia") || raw.includes("antirr")) return "RABIA";
  if (raw.includes("parvo")) return "PARVOVIRUS";
  if (raw.includes("moqui")) return "MOQUILLO";
  if (raw.includes("lepto")) return "LEPTOSPIROSIS";
  if (raw.includes("bordete") || raw.includes("tos")) return "BORDETELLA";
  if (raw.includes("hepat")) return "HEPATITIS";
  if (raw.includes("parain")) return "PARAINFLUENZA";
  if (raw.includes("triple felina")) return "TRIPLE_FELINA";
  if (raw.includes("leucemia")) return "LEUCEMIA_FELINA";
  return "OTRO";
}
