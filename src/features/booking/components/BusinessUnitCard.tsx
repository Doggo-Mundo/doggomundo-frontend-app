import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BUSINESS_UNIT_LABEL,
  BUSINESS_UNIT_DESCRIPTION,
} from "@/types/business-unit";
import type { BusinessUnitCode } from "@/types/business-unit";

interface Props {
  code: BusinessUnitCode;
  selected: boolean;
  onSelect: () => void;
}

export function BusinessUnitCard({ code, selected, onSelect }: Props) {
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
          selected
            ? "ring-2 ring-primary bg-secondary"
            : "hover:shadow-md",
        )}
      >
        <div className="flex items-center gap-3 px-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{BUSINESS_UNIT_LABEL[code]}</p>
            <p className="text-xs text-muted-foreground">
              {BUSINESS_UNIT_DESCRIPTION[code]}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </button>
  );
}
