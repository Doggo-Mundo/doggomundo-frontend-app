import { Bone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message?: string;
  className?: string;
}

/**
 * Full-viewport loader used while the auth restore is in flight and while
 * lazy route chunks are being fetched. Replaces a previous skeleton that
 * looked indistinguishable from a blank page during the cold-start cache
 * miss — this one immediately reads as "loading", on-brand with the
 * "huesitos" language we use across the app.
 *
 * The big bone tumbles slowly while three small bones bounce in sequence
 * underneath. Tailwind's stock `animate-spin` / `animate-bounce` keyframes
 * do the heavy lifting; staggered `animationDelay` makes the bounce read
 * as a wave rather than three bones moving in lockstep.
 */
export function DoggoLoader({
  message = "Cargando huesitos…",
  className,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center gap-5 p-6",
        className,
      )}
    >
      <Bone
        className="h-14 w-14 animate-spin text-primary drop-shadow-sm"
        style={{ animationDuration: "1.6s" }}
        aria-hidden="true"
      />
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Bone
            key={i}
            className="h-3.5 w-3.5 animate-bounce text-amber-500"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
