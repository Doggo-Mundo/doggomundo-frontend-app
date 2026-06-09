import { Navigate, useNavigate } from "react-router-dom";
import { Camera, PackageSearch } from "lucide-react";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { ServiceCard } from "@/features/booking/components/ServiceCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useServices } from "@/api/hooks/use-services";
import type { ServiceCatalogItem } from "@/types/service";

export function ServicePickerPage() {
  const navigate = useNavigate();
  const businessUnitCode = useBookingFlowStore((s) => s.businessUnitCode);
  const location = useBookingFlowStore((s) => s.location);
  const selected = useBookingFlowStore((s) => s.service);
  const setService = useBookingFlowStore((s) => s.setService);

  const isFoto = businessUnitCode === "FOTO";

  const { data, isLoading, isError } = useServices(
    location ? { business_unit: location.businessUnitId } : {},
  );

  if (!location) return <Navigate to="/book/location" replace />;

  function handleSelect(service: ServiceCatalogItem) {
    setService({
      id: service.id,
      name: service.name,
      price: service.base_price,
      durationMinutes: service.base_duration_minutes,
      requiresPet: service.requires_pet,
    });
    navigate("/book/slot");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="service"
        title="¿Qué servicio?"
        description={`${location.businessUnitName} · ${location.name}`}
      />

      {isFoto && (
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-surface-soft p-3 text-sm text-surface-soft-foreground">
          <Camera className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Es una experiencia self-service</p>
            <p className="text-xs text-muted-foreground">
              Tú operas la cabina con un control remoto. Si traes más de un
              perro, agenda a nombre del principal — los demás pueden acompañar.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar los servicios" />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-12 w-12" />}
          title="No hay servicios disponibles"
          description="Esta sucursal aún no tiene servicios agendables para este módulo."
        />
      ) : (
        <ul className="space-y-2">
          {data.results.map((service) => (
            <li key={service.id}>
              <ServiceCard
                service={service}
                selected={selected?.id === service.id}
                onSelect={() => handleSelect(service)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
