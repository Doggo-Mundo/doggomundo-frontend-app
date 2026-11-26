import { useId, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatPesos,
  packageDurationLabel,
  packagePriceFrom,
  sortByOrder,
} from "@/features/booking/lib/grooming-menu";
import type { GroomingMenuPackage } from "@/types/grooming-menu";

interface Props {
  pkg: GroomingMenuPackage;
  /** Paquete referido por `pkg.includes_service`, si viene en el
   *  mismo menú — de ahí salen los chips de "Todo el {name}". */
  includedPackage: GroomingMenuPackage | null;
  selected: boolean;
  defaultExpanded: boolean;
  onSelect: () => void;
}

/**
 * Tarjeta de un paquete de grooming (servicio SIZE_COAT_MATRIX) en el
 * paso de servicio: el cliente decide por contenido, no por precio —
 * por eso se listan las features del paquete (y las del paquete base
 * que incluye) en vez de solo nombre + precio. El precio exacto se
 * cotiza en el paso de mascota (tamaño × pelo); acá solo "Desde".
 */
export function GroomingPackageCard({
  pkg,
  includedPackage,
  selected,
  defaultExpanded,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailsId = useId();

  const priceFrom = packagePriceFrom(pkg);
  const durationLabel = packageDurationLabel(pkg);
  const features = sortByOrder(pkg.features);
  const includedTitles = includedPackage
    ? sortByOrder(includedPackage.features).map((f) => f.title)
    : [];

  return (
    <Card
      size="sm"
      className={cn(
        "transition-all",
        selected ? "ring-2 ring-primary bg-secondary" : "hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full rounded-xl px-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-medium">{pkg.name}</p>
            {pkg.tagline && (
              <p className="text-xs text-muted-foreground">{pkg.tagline}</p>
            )}
            {durationLabel && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {durationLabel}
              </p>
            )}
          </div>
          {priceFrom !== null && (
            <span className="shrink-0 text-right text-sm font-semibold">
              <span className="block text-[11px] font-normal text-muted-foreground">
                Desde
              </span>
              {formatPesos(priceFrom)}
            </span>
          )}
        </div>
      </button>

      <div className="space-y-3 px-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary outline-none focus-visible:underline"
        >
          {expanded ? "Ocultar detalle" : "Ver qué incluye"}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded && (
          <div id={detailsId} className="space-y-3 text-sm">
            {pkg.includes_service && (
              <div className="space-y-1.5">
                <p className="font-medium">
                  Todo el {pkg.includes_service.name}
                </p>
                {includedTitles.length > 0 && (
                  <ul
                    className="flex flex-wrap gap-1.5"
                    aria-label={`Incluido en ${pkg.includes_service.name}`}
                  >
                    {includedTitles.map((title) => (
                      <li
                        key={title}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {title}
                      </li>
                    ))}
                  </ul>
                )}
                {features.length > 0 && (
                  <p className="pt-1 font-medium">Y además:</p>
                )}
              </div>
            )}

            {features.length > 0 && (
              <ul className="space-y-1.5" aria-label={`Qué incluye ${pkg.name}`}>
                {features.map((f) => (
                  <li key={f.id} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        f.on_request
                          ? "border border-primary bg-transparent"
                          : "bg-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span>{f.title}</span>
                      {f.on_request && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · solo si lo solicitas
                        </span>
                      )}
                      {f.description && (
                        <span className="block text-xs text-muted-foreground">
                          {f.description}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={onSelect}
            >
              Elegir este paquete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
