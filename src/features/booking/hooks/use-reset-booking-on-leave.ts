import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useBookingFlowStore } from "@/stores/booking-flow-store";

/** Rutas fuera de /book que forman parte del flujo (ej. dar de alta
 *  otra mascota desde el paso de mascota) — salir hacia ellas no
 *  descarta la reserva en curso. */
const KEEP_FLOW_PREFIXES = ["/pets/new"];

/**
 * Salir del wizard de reserva (ir a Inicio, Mis citas, etc.) descarta la
 * reserva en curso, para que "Reservar" vuelva a empezar desde el primer
 * paso. Recargar la página no cuenta como salir (no hay cambio de ruta),
 * así que la reserva se conserva en ese caso.
 */
export function useResetBookingOnLeave() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  const reset = useBookingFlowStore((s) => s.reset);

  useEffect(() => {
    const wasInFlow = previous.current.startsWith("/book");
    previous.current = pathname;
    const leftFlow =
      wasInFlow &&
      !pathname.startsWith("/book") &&
      !KEEP_FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (leftFlow) reset();
  }, [pathname, reset]);
}
