import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
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
import { LoadingState } from "@/components/shared/LoadingState";
import { PetsBreadcrumb } from "@/features/pets/components/PetsBreadcrumb";
import { VlmStatusChip } from "@/features/pets/components/VlmStatusChip";
import {
  useConfirmCartilla,
  usePet,
  usePetDocument,
  useRetryExtraction,
} from "@/api/hooks/use-pets";
import {
  VACCINE_TYPE_LABEL,
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
        (v) => new Date(v) <= new Date(),
        "No puede ser fecha futura.",
      ),
    next_due_date: z.string().optional().or(z.literal("")),
    vet_name: z.string().optional().or(z.literal("")),
    vet_clinic: z.string().optional().or(z.literal("")),
    batch_number: z.string().optional().or(z.literal("")),
    /** Solo UI — se pasa desde el VLM para pintar el badge; no
     *  viaja al backend. */
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
    .min(1, "Debes registrar al menos una vacuna."),
});

type FormValues = z.infer<typeof schema>;

export function CartillaConfirmPage() {
  const { id, docId } = useParams<{ id: string; docId: string }>();
  const navigate = useNavigate();

  const { data: pet } = usePet(id ?? "");
  const { data: doc, isLoading } = usePetDocument(id ?? "", docId ?? "", {
    poll: true,
  });
  const retry = useRetryExtraction(id ?? "", docId ?? "");
  const confirm = useConfirmCartilla(id ?? "", docId ?? "");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vaccinations: [emptyVaccine()] },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "vaccinations",
  });

  // Cuando la respuesta VLM llega, precargamos el form. Se ejecuta
  // solo una vez por doc — si el usuario ya editó campos, no los
  // pisamos.
  const seedKey = useMemo(
    () => `${doc?.id}-${doc?.vlm_extraction_status}`,
    [doc?.id, doc?.vlm_extraction_status],
  );
  useEffect(() => {
    if (!doc) return;
    if (!form.formState.isDirty) {
      const seeds = seedFromVlm(doc.vlm_raw_extraction);
      replace(seeds.length ? seeds : [emptyVaccine()]);
    }
    // seedKey se compara para evitar loop; los deps de eslint no
    // deben empujarnos a añadir replace/form (referencias estables).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  if (!id || !docId) return <Navigate to="/pets" replace />;

  const isInFlight =
    doc?.vlm_extraction_status === "PENDING" ||
    doc?.vlm_extraction_status === "PROCESSING";

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
      },
      {
        onSuccess: () => {
          toast.success("Vacunas registradas");
          navigate(`/pets/${id}/vaccinations`);
        },
        onError: () => {
          toast.error("No pudimos guardar las vacunas. Intenta de nuevo.");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <PetsBreadcrumb petId={id} petName={pet?.name} />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/pets/${id}/documents`)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Volver a documentos
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Confirmar cartilla</CardTitle>
            {doc && <VlmStatusChip status={doc.vlm_extraction_status} />}
          </div>
          <CardDescription>
            Revisa los datos que extrajimos de la foto y corrige lo que
            haga falta antes de guardar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !doc ? (
            <LoadingState rows={3} />
          ) : isInFlight ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Estamos leyendo tu cartilla. En unos segundos podrás confirmar
              los datos.
            </div>
          ) : doc.vlm_extraction_status === "FAILED" ? (
            <FailedBanner
              onRetry={() => retry.mutate()}
              retrying={retry.isPending}
            />
          ) : null}

          {doc && !isInFlight && (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {fields.map((field, index) => (
                <VaccineRow
                  key={field.id}
                  index={index}
                  form={form}
                  onRemove={fields.length > 1 ? () => remove(index) : null}
                />
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(emptyVaccine())}
                >
                  <Plus className="mr-1 h-4 w-4" /> Agregar vacuna
                </Button>
                <div className="flex-1" />
                <Button
                  type="submit"
                  disabled={confirm.isPending}
                >
                  {confirm.isPending ? "Guardando..." : "Confirmar y guardar"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface FailedBannerProps {
  onRetry: () => void;
  retrying: boolean;
}

function FailedBanner({ onRetry, retrying }: FailedBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 space-y-2">
        <p className="font-medium">
          No pudimos leer la cartilla automáticamente
        </p>
        <p className="text-rose-800">
          Puedes reintentar o digitar las vacunas manualmente aquí abajo.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={retrying}
          onClick={onRetry}
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          {retrying ? "Reintentando..." : "Reintentar extracción"}
        </Button>
      </div>
    </div>
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
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
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
            aria-label="Quitar vacuna"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
                  <SelectValue placeholder="Selecciona un tipo" />
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
          {errors?.vaccine_type && (
            <p className="text-xs text-rose-700">
              {errors.vaccine_type.message}
            </p>
          )}
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
          <Label>Próximo refuerzo (opcional)</Label>
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
        "rounded-full px-2 py-0.5 text-[11px] font-medium " + cfg.cls
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

/** Intenta mapear la categoría / tipo del VLM a un VaccineType del
 *  backend. Si no logra, cae a OTRO — el usuario puede corregir. */
function normalizeVaccineType(v: VlmExtractedVaccine): VaccineType {
  const raw = (v.tipo ?? v.categoria ?? "").toLowerCase();
  if (raw.includes("rabia")) return "RABIA";
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
