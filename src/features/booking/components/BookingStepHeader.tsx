import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEffectiveBookingSteps } from "@/features/booking/hooks/use-effective-booking-steps";
import { Progress } from "@/components/ui/progress";

interface Props {
  stepKey: string;
  /**
   * Optional override. When omitted, the back link points at the previous
   * step in the *effective* steps array — so it correctly skips back past
   * the location picker when there's only one sucursal.
   */
  backTo?: string;
  title: string;
  description?: string;
}

export function BookingStepHeader({ stepKey, backTo, title, description }: Props) {
  const { steps, total } = useEffectiveBookingSteps();
  const step = steps.find((s) => s.key === stepKey);
  const index = step?.index ?? 1;
  const percent = (index / total) * 100;

  // When no explicit backTo is passed, point at the previous effective step
  // so the wizard's back button stays correct even when location is skipped.
  const prevPath = step
    ? steps[step.index - 2]?.path ?? steps[0].path
    : steps[0].path;
  const resolvedBackTo = backTo ?? prevPath;

  return (
    <header className="space-y-3">
      <Link
        to={resolvedBackTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Atrás
      </Link>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Paso {index} de {total}
        </p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Progress value={percent} className="h-1" />
    </header>
  );
}
