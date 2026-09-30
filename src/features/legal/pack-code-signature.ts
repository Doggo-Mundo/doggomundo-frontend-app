/**
 * F-G.4: helpers para persistir la firma del Código de la Manada
 * en `localStorage`, de manera que:
 *
 * - Sobrevive al cierre / reload del tab de registro. Si el usuario
 *   firma, cierra el navegador, y vuelve al register más tarde, el
 *   checkbox arranca ya marcado.
 * - Sincroniza en vivo entre pestañas del mismo origin vía el
 *   evento `storage` (que dispara `localStorage` en las OTRAS
 *   pestañas del mismo origin cuando otra pestaña escribe).
 *
 * Es UI-only: la persistencia legal real ocurre al submit del
 * register, cuando el backend crea el `LegalAcceptance`. Este
 * localStorage solo mantiene el estado "el usuario firmó" del lado
 * cliente hasta que el registro se complete.
 */

export const PACK_CODE_SIGNATURE_KEY = "doggo-mundo:pack-code-signature";

/** Nombre del CustomEvent que el mismo tab puede escuchar cuando
 *  escribe la firma (el evento `storage` nativo NO dispara en la
 *  pestaña que hizo el write — solo en las demás). Lo usamos para
 *  que, si por alguna razón el register form vive en la misma
 *  pestaña que la firma, también se entere. */
export const PACK_CODE_SIGNED_EVENT = "pack-code-signed";

export interface StoredSignature {
  full_name: string;
  phone: string;
  pet_names: string;
  signed_at: string;
}

export function readStoredSignature(): StoredSignature | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PACK_CODE_SIGNATURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    // Guard mínimo — si el schema cambia, ignoramos silenciosamente
    // para no romper el register.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "full_name" in parsed &&
      "signed_at" in parsed
    ) {
      return parsed as StoredSignature;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredSignature(sig: StoredSignature) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PACK_CODE_SIGNATURE_KEY, JSON.stringify(sig));
    // Notifica a los otros tabs vía el evento nativo (automático),
    // y a la MISMA pestaña vía un CustomEvent — porque `storage`
    // solo dispara en tabs distintos al que escribió.
    window.dispatchEvent(
      new CustomEvent(PACK_CODE_SIGNED_EVENT, { detail: sig }),
    );
  } catch {
    // Cuota llena, modo privado que bloquea storage, etc. Silent
    // fail — la firma sigue viva en la pestaña actual vía state.
  }
}

export function clearStoredSignature() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PACK_CODE_SIGNATURE_KEY);
  } catch {
    // ignore
  }
}
