import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shaped placeholder mirroring AppointmentCard while the list loads. */
export function AppointmentCardSkeleton() {
  return (
    <Card size="sm">
      <div className="flex items-start gap-3 px-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

interface Props {
  rows?: number;
}

export function AppointmentListSkeleton({ rows = 3 }: Props) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <AppointmentCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
