import { Link } from "react-router-dom";
import { ChevronRight, Crown, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlanListSkeleton } from "@/components/shared/skeletons/SubscriptionCardSkeleton";
import { PlanCard } from "@/features/memberships/components/PlanCard";
import {
  useMembershipPlans,
  useMySubscriptions,
} from "@/api/hooks/use-memberships";

export function MembershipCatalogPage() {
  const { data: plans, isLoading, isError } = useMembershipPlans();
  const { data: activeSubs } = useMySubscriptions();
  const hasActive = (activeSubs ?? []).length > 0;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Membresías</h1>
        <p className="text-sm text-muted-foreground">
          Planes mensuales o trimestrales con servicios incluidos para tu peludo.
        </p>
      </header>

      {hasActive && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Crown className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">Ya tienes una suscripción activa</p>
              <p className="text-xs text-muted-foreground">
                Consulta tus beneficios y ciclos.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/my/subscriptions">
                Ver
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <PlanListSkeleton rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar los planes" />
      ) : !plans || plans.length === 0 ? (
        <EmptyState
          icon={<PackageX className="h-12 w-12" />}
          title="Aún no hay planes disponibles"
          description="Pronto habrá membresías para tu peludo."
        />
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard plan={plan} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
