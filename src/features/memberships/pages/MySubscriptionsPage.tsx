import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyMembershipIllustration } from "@/components/shared/illustrations/EmptyMembershipIllustration";
import { SubscriptionListSkeleton } from "@/components/shared/skeletons/SubscriptionCardSkeleton";
import { SubscriptionCard } from "@/features/memberships/components/SubscriptionCard";
import { useMySubscriptions } from "@/api/hooks/use-memberships";
import { cn } from "@/lib/utils";

type Tab = "active" | "cancelled";

export function MySubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const { data: activeSubs, isLoading: activeLoading, isError: activeError } =
    useMySubscriptions();
  const {
    data: cancelledSubs,
    isLoading: cancelledLoading,
    isError: cancelledError,
  } = useMySubscriptions({ status: "cancelled" });

  const current = tab === "active" ? activeSubs : cancelledSubs;
  const isLoading = tab === "active" ? activeLoading : cancelledLoading;
  const isError = tab === "active" ? activeError : cancelledError;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Mis suscripciones</h1>
          <p className="text-sm text-muted-foreground">
            Consulta tus membresías activas e historial.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/memberships">
            <Plus />
            Nueva
          </Link>
        </Button>
      </header>

      <div className="flex rounded-lg bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "active"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={tab === "active"}
        >
          Activas{" "}
          {activeSubs && activeSubs.length > 0 && `(${activeSubs.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("cancelled")}
          className={cn(
            "flex-1 rounded-md py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === "cancelled"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={tab === "cancelled"}
        >
          Canceladas
        </button>
      </div>

      {isLoading ? (
        <SubscriptionListSkeleton rows={2} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus suscripciones" />
      ) : !current || current.length === 0 ? (
        <EmptyState
          illustration={<EmptyMembershipIllustration />}
          title={
            tab === "active"
              ? "No tienes suscripciones activas"
              : "Sin suscripciones canceladas"
          }
          description={
            tab === "active"
              ? "Explora los planes disponibles y elige el que mejor le acomode a tu peludo."
              : undefined
          }
          action={
            tab === "active" ? (
              <Button asChild>
                <Link to="/memberships">Ver planes</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {current.map((sub) => (
            <li key={sub.id}>
              <SubscriptionCard subscription={sub} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
