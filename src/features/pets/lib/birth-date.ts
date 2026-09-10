import { z } from "zod";
import { toZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/format-date";

/**
 * "Hoy" en la zona horaria de operación (America/Mexico_City),
 * formato ISO `YYYY-MM-DD`. Usamos TZ mexicana explícitamente
 * porque `new Date().toISOString().slice(0,10)` da UTC — de
 * noche en México (después de las 18:00 CDMX) esa fecha ya
 * cambió al día siguiente y el `max` del picker aceptaría
 * fechas "futuras" desde la perspectiva del usuario. Mirror
 * del helper `_today_local` del backend (ver
 * feedback_timezone_now_date_bug memory).
 */
export function todayInMxTz(): string {
  const nowMx = toZonedTime(new Date(), TIMEZONE);
  const y = nowMx.getFullYear();
  const m = String(nowMx.getMonth() + 1).padStart(2, "0");
  const d = String(nowMx.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Zod validator para `birth_date` en los forms de mascota.
 * - Opcional (permite string vacío o undefined).
 * - Rechaza fechas futuras con mensaje claro para el usuario.
 *
 * Coincide con la validación del backend (`Pet.clean()` rebota
 * fechas > hoy). Además del refine, los `<Input type="date">`
 * ponen `max={todayInMxTz()}` para bloquear la selección en el
 * picker nativo — el refine es la red de seguridad si el user
 * ingresa la fecha tecleando.
 */
export const birthDateSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || v <= todayInMxTz(),
    { message: "La fecha de nacimiento no puede ser futura." },
  );
