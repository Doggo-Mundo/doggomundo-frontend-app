import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

/**
 * Feed del álbum del cliente — cada fila es una cita con fotos.
 * Backend: `GET /api/appointments/me/photo-sessions/`.
 */
export interface PhotoSession {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  photo_count: number;
  cover_url: string | null;
  business_unit_code: string | null;
  business_unit_name: string | null;
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useMyPhotoSessions() {
  return useQuery({
    queryKey: ["my-photo-sessions"] as const,
    queryFn: async () => {
      const res = await api.get<Paginated<PhotoSession> | PhotoSession[]>(
        "/appointments/me/photo-sessions/",
      );
      // Aceptamos ambas formas por si en el futuro dejamos de paginar.
      return Array.isArray(res.data) ? res.data : res.data.results;
    },
  });
}
