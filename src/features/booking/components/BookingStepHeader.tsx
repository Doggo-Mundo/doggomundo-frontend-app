import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { BOOKING_STEPS, TOTAL_STEPS } from "@/features/booking/lib/steps";
import { Progress } from "@/components/ui/progress";

interface Props {
  stepKey: string;
  backTo: string;
  title: string;
  description?: string;
}

export function BookingStepHeader({ stepKey, backTo, title, description }: Props) {
  const step = BOOKING_STEPS.find((s) => s.key === stepKey);
  const index = step?.index ?? 1;
  const percent = (index / TOTAL_STEPS) * 100;

  return (
    <header className="space-y-3">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Atrás
      </Link>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Paso {index} de {TOTAL_STEPS}
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
