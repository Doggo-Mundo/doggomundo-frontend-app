import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServiceCatalogItem } from "@/types/service";

interface Props {
  service: ServiceCatalogItem;
  selected: boolean;
  onSelect: () => void;
}

export function ServiceCard({ service, selected, onSelect }: Props) {
  const price = Number(service.base_price);
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `$${price.toLocaleString("es-MX")}`
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-pressed={selected}
    >
      <Card
        size="sm"
        className={cn(
          "transition-all",
          selected ? "ring-2 ring-primary bg-secondary" : "hover:shadow-md",
        )}
      >
        <div className="flex items-center gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-medium">{service.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {service.base_duration_minutes} min
            </p>
          </div>
          {priceLabel && (
            <span className="shrink-0 text-sm font-semibold">{priceLabel}</span>
          )}
        </div>
      </Card>
    </button>
  );
}
