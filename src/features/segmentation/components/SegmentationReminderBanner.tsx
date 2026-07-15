import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMySegmentation } from "@/api/hooks/use-segmentation";
import {
  dismissSegmentationBanner,
  isSegmentationBannerDismissed,
} from "@/features/segmentation/banner-dismiss";

/**
 * Persistent nudge shown in the dashboard shell while the customer
 * hasn't completed the segmentation survey. Dismissible with a
 * 30-day cooldown; reappears afterward so silent-forever isn't a
 * failure mode. Renders `null` — takes zero space — when either:
 *   - profile query hasn't resolved yet
 *   - user already completed the survey
 *   - user dismissed within the cooldown
 * so it's safe to always mount at the top of the shell.
 */
export function SegmentationReminderBanner() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMySegmentation();
  // Re-check on every render — 30-day cooldown expiring mid-session
  // is unusual but harmless to detect immediately.
  const [dismissed, setDismissed] = useState(() =>
    isSegmentationBannerDismissed(),
  );

  if (isLoading) return null;
  if (profile) return null;
  if (dismissed) return null;

  function handleDismiss() {
    dismissSegmentationBanner();
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label="Recordatorio para personalizar tu experiencia"
      className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
    >
      <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Ayúdanos a personalizar tu experiencia</p>
        <p className="text-xs text-muted-foreground">
          2 minutos. Vas a ver recomendaciones y beneficios más relevantes
          para ti y tu perro.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          onClick={() => navigate("/onboarding/preferences")}
        >
          Empezar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          aria-label="Cerrar recordatorio"
          title="Cerrar por 30 días"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
