import { CheckCircle2, Loader2, AlertTriangle, PencilLine } from "lucide-react";
import type { VlmExtractionStatus } from "@/types/pet";

interface VlmStatusChipProps {
  status: VlmExtractionStatus;
  className?: string;
}

/** F-I: badge del estado del pipeline VLM sobre una cartilla.
 *  Diseñado para vivir junto al nombre del documento en la lista;
 *  cambia color e icono según el estado. Los estados NOT_APPLICABLE
 *  (documentos que no son cartillas) no renderizan nada — devolver
 *  null es más limpio que un chip "N/A" ruidoso. */
export function VlmStatusChip({ status, className }: VlmStatusChipProps) {
  if (status === "NOT_APPLICABLE") return null;

  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 " +
        "text-[11px] font-medium " +
        cfg.classes +
        (className ? " " + className : "")
      }
      title={cfg.tooltip}
    >
      <Icon
        className={
          "h-3 w-3 " + (status === "PROCESSING" ? "animate-spin" : "")
        }
      />
      {cfg.label}
    </span>
  );
}

const STATUS_CONFIG: Record<
  Exclude<VlmExtractionStatus, "NOT_APPLICABLE">,
  {
    label: string;
    icon: typeof Loader2;
    classes: string;
    tooltip: string;
  }
> = {
  PENDING: {
    label: "En cola",
    icon: Loader2,
    classes: "bg-amber-100 text-amber-800",
    tooltip: "Esperando a que el pipeline la procese.",
  },
  PROCESSING: {
    label: "Procesando",
    icon: Loader2,
    classes: "bg-blue-100 text-blue-800",
    tooltip: "Extrayendo información de la cartilla...",
  },
  EXTRACTED: {
    label: "Lista para revisar",
    icon: CheckCircle2,
    classes: "bg-emerald-100 text-emerald-800",
    tooltip: "Revisa los datos y confírmalos.",
  },
  CONFIRMED: {
    label: "Confirmada",
    icon: CheckCircle2,
    classes: "bg-emerald-100 text-emerald-800",
    tooltip: "Vacunas ya registradas.",
  },
  MANUAL: {
    label: "Digitada",
    icon: PencilLine,
    classes: "bg-slate-100 text-slate-800",
    tooltip: "Digitada manualmente por el equipo.",
  },
  FAILED: {
    label: "Falló extracción",
    icon: AlertTriangle,
    classes: "bg-rose-100 text-rose-800",
    tooltip: "No pudimos leerla automáticamente. Puedes reintentar.",
  },
};
