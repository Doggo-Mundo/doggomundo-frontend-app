import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LocationListItem } from "@/types/location";

interface Props {
  location: LocationListItem;
  selected: boolean;
  onSelect: () => void;
}

export function LocationCard({ location, selected, onSelect }: Props) {
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
        <div className="flex items-start gap-3 px-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-medium">{location.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {location.address}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}
