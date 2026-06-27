import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  planName: string;
  remaining: number;
  total: number;
  /** True = customer wants to use the benefit for this booking. */
  use: boolean;
  onToggle: (next: boolean) => void;
}

/**
 * Membership coverage indicator in the booking review step.
 *
 * When `use` is true the card has an active, celebratory look — the
 * benefit is being applied, no card will be charged. Toggle flips
 * to "Prefiero pagar y guardar mi beneficio" semantics: customer
 * pays out of pocket this time and keeps the redemption for later.
 *
 * The card mirrors how Petco / Resy / OpenTable Premium surface
 * member savings — visible, with explicit opt-out, so the customer
 * perceives the value of their membership rather than wondering
 * "did they know I'm a member?"
 */
export function CoverageCard({
  planName,
  remaining,
  total,
  use,
  onToggle,
}: Props) {
  const remainingAfter = use ? Math.max(0, remaining - 1) : remaining;
  return (
    <Card
      className={cn(
        "transition-colors",
        use
          ? "border-emerald-400/60 bg-emerald-50/60"
          : "border-dashed",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {use ? (
            <Sparkles className="h-4 w-4 text-emerald-600" />
          ) : (
            <Crown className="h-4 w-4 text-muted-foreground" />
          )}
          {use ? "Cubierto por tu membresía" : "Tu membresía cubre esto"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <p className={use ? "text-emerald-900" : "text-muted-foreground"}>
          Plan <strong>{planName}</strong>. Te {use ? "quedan" : "quedan"}{" "}
          <strong>
            {remainingAfter} de {total}
          </strong>{" "}
          este período.
          {use && remaining === 1 && (
            <span className="ml-1 text-xs">
              (este es tu último)
            </span>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "-ml-2 h-auto px-2 py-1 text-xs",
            use
              ? "text-emerald-700 hover:text-emerald-900"
              : "text-primary",
          )}
          onClick={() => onToggle(!use)}
        >
          {use
            ? "Prefiero pagar y guardar mi beneficio →"
            : "← Usar mi beneficio para esta cita"}
        </Button>
      </CardContent>
    </Card>
  );
}
