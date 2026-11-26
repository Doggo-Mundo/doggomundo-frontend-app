import { Navigate, useNavigate } from "react-router-dom";
import { Camera, PackageSearch } from "lucide-react";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { ServiceCard } from "@/features/booking/components/ServiceCard";
import { GroomingPackageCard } from "@/features/booking/components/GroomingPackageCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { useGroomingMenu, useServices } from "@/api/hooks/use-services";
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

  // Solo pedimos el menú de grooming cuando la unidad tiene algún
  // servicio de calculadora — es lo que trae qué incluye cada paquete.
  const hasMatrix = !!data?.results.some(
    (s) => s.pricing_mode === "SIZE_COAT_MATRIX",
  );
  const { data: menu, isLoading: menuLoading } = useGroomingMenu(
    hasMatrix && location ? location.businessUnitId : null,
  );
  const packagesById = new Map(
    (menu?.packages ?? []).map((pkg) => [pkg.id, pkg]),
  );
  const matrixCount =
    data?.results.filter((s) => packagesById.has(s.id)).length ?? 0;

  if (!location) return <Navigate to="/book/location" replace />;

  function handleSelect(service: ServiceCatalogItem) {
    setService({
      id: service.id,
      name: service.name,
      price: service.base_price,
      durationMinutes: service.base_duration_minutes,
      requiresPet: service.requires_pet,
      pricingMode: service.pricing_mode,
    });
    navigate("/book/pet");
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

      {/* Esperamos el menú para no cambiar la tarjeta simple por la
          detallada bajo el dedo; si falla, quedan las simples. */}
      {isLoading || (hasMatrix && menuLoading) ? (
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
          {data.results.map((service) => {
            const pkg =
              service.pricing_mode === "SIZE_COAT_MATRIX"
                ? packagesById.get(service.id)
                : undefined;
            return (
              <li key={service.id}>
                {pkg ? (
                  <GroomingPackageCard
                    pkg={pkg}
                    includedPackage={
                      pkg.includes_service
                        ? (packagesById.get(pkg.includes_service.id) ?? null)
                        : null
                    }
                    selected={selected?.id === service.id}
                    defaultExpanded={matrixCount <= 2}
                    onSelect={() => handleSelect(service)}
                  />
                ) : (
                  <ServiceCard
                    service={service}
                    selected={selected?.id === service.id}
                    onSelect={() => handleSelect(service)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {matrixCount > 0 && (
        <p className="text-xs text-muted-foreground">
          El precio final depende del tamaño y pelo de tu Doggo — lo
          calculamos en el siguiente paso. Deluxe y extras se pueden
          agregar después.
        </p>
      )}
    </div>
  );
}
