import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SubscriptionCardSkeleton() {
  return (
    <Card size="sm">
      <div className="flex items-start gap-3 px-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </Card>
  );
}

export function PlanCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="ml-auto h-5 w-20" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  rows?: number;
}

export function SubscriptionListSkeleton({ rows = 2 }: Props) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <SubscriptionCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function PlanListSkeleton({ rows = 2 }: Props) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <PlanCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
