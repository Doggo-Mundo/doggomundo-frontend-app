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
// V2: bloques de color plano de la paleta de la landing.
const VARIANT_ICON: Record<QuickActionVariant, string> = {
  primary: "bg-sun text-primary",
  sun: "bg-surface-soft text-primary",
  amber: "bg-brand-warm-1 text-primary",
  gold: "bg-brand-blue-5 text-primary",
  neutral: "bg-brand-warm-2 text-primary",
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
      className="group block h-full rounded-3xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <Card
        className="h-full transition-transform group-hover:-translate-y-1 group-hover:-rotate-1"
      >
        <CardContent className="flex h-full flex-col gap-2 py-4">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink transition-transform group-hover:scale-110",
                VARIANT_ICON[variant],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-display text-base font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
