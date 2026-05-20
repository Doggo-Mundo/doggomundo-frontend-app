import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the NextAppointmentHero card on Home. */
export function HeroSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="space-y-3 py-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}
