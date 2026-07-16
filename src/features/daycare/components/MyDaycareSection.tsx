import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  Infinity as InfinityIcon,
  RotateCw,
  Sun,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { useEnrollments } from "@/api/hooks/use-daycare";
import type { DaycareEnrollmentList } from "@/types/daycare";

const EXPIRING_SOON_DAYS = 7;

/**
 * Profile-nested list of the customer's day care enrollments.
 * Renders NOTHING when the query is still loading OR when there
 * are no enrollments at all — a customer who never bought a pack
 * shouldn't see an "empty state" for a feature they haven't opted
 * into. The landing page (/daycare) is the discovery surface.
 *
 * ACTIVE enrollments show a "reservar día" affordance. Expired or
 * expiring-in-≤7d enrollments get a subtle "recomprar" button that
 * takes the customer back to the plan catalog.
 */
export function MyDaycareSection() {
  const { data, isLoading } = useEnrollments();
  if (isLoading) return null;

  const enrollments = data?.results ?? [];
  if (enrollments.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonCutoff = new Date(today);
  soonCutoff.setDate(soonCutoff.getDate() + EXPIRING_SOON_DAYS);

  // Sort: active first, then by expiration ascending so the most
  // urgent ("expira mañana") floats to the top of each bucket.
  const sorted = [...enrollments].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return a.expires_at.localeCompare(b.expires_at);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-4 w-4 text-amber-500" />
          Mi Day Care
        </CardTitle>
        <CardDescription>
          Tus packs activos y su historial. Cuando te queden pocos días,
          te avisamos por correo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((e) => (
          <EnrollmentRow
            key={e.id}
            enrollment={e}
            expiringSoonCutoff={soonCutoff}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface RowProps {
  enrollment: DaycareEnrollmentList;
  expiringSoonCutoff: Date;
}

function EnrollmentRow({ enrollment, expiringSoonCutoff }: RowProps) {
  const expires = new Date(enrollment.expires_at);
  const isActive = enrollment.status === "active";
  const isExpiringSoon =
    isActive && expires <= expiringSoonCutoff;
  const isTerminal =
    enrollment.status === "expired"
    || enrollment.status === "cancelled";

  const creditsLabel = enrollment.is_unlimited
    ? "Visitas ilimitadas"
    : enrollment.credits_remaining === 1
      ? "1 crédito"
      : `${enrollment.credits_remaining ?? 0} créditos`;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isTerminal && "opacity-70",
        isExpiringSoon && "border-amber-400/60 bg-amber-50/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium">
            {enrollment.plan_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Para <strong>{enrollment.pet_name}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {enrollment.is_unlimited && (
                <InfinityIcon className="h-3 w-3" />
              )}
              {creditsLabel}
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {isTerminal ? "Venció" : "Vence"} el{" "}
              {formatDate(enrollment.expires_at)}
            </span>
          </div>
        </div>
        <StatusPill status={enrollment.status} />
      </div>

      {isExpiringSoon && (
        <div className="flex items-start gap-1.5 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Vence pronto — usa tus créditos o compra un nuevo pack antes
            de perderlos.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isActive && (
          <>
            <Button asChild size="sm" variant="default">
              <Link to="/daycare/book">
                Reservar día
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/daycare/days">
                <CalendarDays className="mr-1 h-3 w-3" />
                Mis días
              </Link>
            </Button>
          </>
        )}
        {(isTerminal || isExpiringSoon) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/daycare">
              <RotateCw className="mr-1 h-3 w-3" />
              Recomprar pack
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DaycareEnrollmentList["status"] }) {
  const label: Record<DaycareEnrollmentList["status"], string> = {
    active: "Activo",
    expired: "Vencido",
    cancelled: "Cancelado",
    paused: "Pausado",
  };
  const className: Record<DaycareEnrollmentList["status"], string> = {
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
    paused: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        className[status],
      )}
    >
      {label[status]}
    </span>
  );
}
