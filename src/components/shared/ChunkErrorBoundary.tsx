import * as Sentry from "@sentry/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  CHUNK_ERROR_RELOAD_FLAG,
  isChunkLoadError,
  isReloading,
  tryReloadOnce,
} from "@/lib/chunk-reload";

/**
 * Every deploy rotates the hashed JS chunk filenames (vite content hashing).
 * A tab left open across a deploy that then does a client-side navigation
 * to a not-yet-visited lazy route (`React.lazy`) tries to import() a chunk
 * the new build no longer serves. React re-throws that rejection during
 * render — Suspense doesn't catch it, only the nearest error boundary does
 * — and without one the app silently unmounts to a blank page. A reload
 * picks up the current build's index.html/chunk map, which fixes it.
 *
 * The reload guard lives in `lib/chunk-reload` (cooldown-based, not cleared
 * on mount), so a chunk that's missing for a real reason (bad deploy, actual
 * 404) doesn't reload-loop — it falls through to the visible fallback below.
 */
export function ChunkErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      onError={(error) => {
        if (isChunkLoadError(error)) tryReloadOnce();
      }}
      fallback={({ error, resetError }) => {
        if (isChunkLoadError(error) && isReloading()) {
          // Reload about to happen via onError above — avoid flashing
          // the error card for what's really just a brief redirect.
          return (
            <div className="flex h-screen items-center justify-center p-8">
              <LoadingState rows={3} />
            </div>
          );
        }
        return (
          <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-lg font-medium">Ocurrió un error inesperado</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Si el problema persiste después de recargar, contacta a soporte.
            </p>
            <Button
              onClick={() => {
                sessionStorage.removeItem(CHUNK_ERROR_RELOAD_FLAG);
                resetError();
                window.location.reload();
              }}
            >
              Recargar
            </Button>
          </div>
        );
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
