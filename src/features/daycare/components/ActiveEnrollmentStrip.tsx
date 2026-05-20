import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import type { DaycareEnrollmentList } from "@/types/daycare";

interface Props {
  enrollment: DaycareEnrollmentList;
}

export function ActiveEnrollmentStrip({ enrollment }: Props) {
  const creditsLabel = enrollment.is_unlimited
    ? "Visitas ilimitadas"
    : enrollment.credits_remaining === 1
      ? "1 crédito"
      : `${enrollment.credits_remaining ?? 0} créditos`;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Tu plan
          </p>
          <p className="truncate text-base font-semibold">
            {enrollment.plan_name} · {enrollment.pet_name}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {enrollment.is_unlimited && (
                <InfinityIcon className="h-3.5 w-3.5" />
              )}
              {creditsLabel}
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              Vence el {formatDate(enrollment.expires_at)}
            </span>
          </div>
        </div>
        <Link
          to="/daycare/book"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Reservar día
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
