import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder mirroring PetCard. */
export function PetCardSkeleton() {
  return (
    <Card size="sm">
      <div className="flex items-center gap-3 px-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </Card>
  );
}

interface Props {
  rows?: number;
}

export function PetListSkeleton({ rows = 2 }: Props) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <PetCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
