import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";

interface Props {
  /** Milliseconds before auto-navigating away. Pass 0 to disable. */
  autoNavigateMs?: number;
  autoNavigateTo?: string;
}

export function BookingSuccessAnimation({
  autoNavigateMs = 2800,
  autoNavigateTo = "/my/appointments",
}: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoNavigateMs) return;
    const t = setTimeout(
      () => navigate(autoNavigateTo, { replace: true }),
      autoNavigateMs,
    );
    return () => clearTimeout(t);
  }, [autoNavigateMs, autoNavigateTo, navigate]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <SuccessCheckmark />

      <h2 className="mt-6 text-2xl font-semibold">¡Listo!</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Tu cita quedó agendada. Te esperamos.
      </p>

      <div className="mt-6">
        <Button asChild>
          <Link to={autoNavigateTo} replace>
            Ver mis citas
          </Link>
        </Button>
      </div>
    </div>
  );
}
