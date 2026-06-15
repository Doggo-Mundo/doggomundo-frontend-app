import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type QuickActionVariant = "primary" | "sun" | "amber" | "gold" | "neutral";

interface Props {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  variant?: QuickActionVariant;
}

// Per-variant icon container colors. Keeps the rest of the card neutral so
// the accent reads as a brand highlight, not a marketing block.
const VARIANT_ICON: Record<QuickActionVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  sun: "bg-amber-100 text-amber-700",
  amber: "bg-orange-100 text-orange-700",
  gold: "bg-yellow-100 text-yellow-700",
  neutral: "bg-primary/10 text-primary",
};

// Soft hover tint so each tile feels distinct on focus, not uniformly gray.
const VARIANT_HOVER: Record<QuickActionVariant, string> = {
  primary: "group-hover:border-primary/50",
  sun: "group-hover:border-amber-300",
  amber: "group-hover:border-orange-300",
  gold: "group-hover:border-yellow-300",
  neutral: "group-hover:border-primary/40",
};

export function QuickActionTile({
  to,
  label,
  description,
  icon: Icon,
  variant = "neutral",
}: Props) {
  return (
    <Link
      to={to}
      className="group block h-full rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "h-full border transition-all group-hover:-translate-y-1 group-hover:shadow-lg",
          VARIANT_HOVER[variant],
        )}
      >
        <CardContent className="flex h-full flex-col gap-2 py-4">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                VARIANT_ICON[variant],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
