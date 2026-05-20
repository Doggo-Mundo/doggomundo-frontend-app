import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PetAvatar } from "./PetAvatar";
import { Progress } from "@/components/ui/progress";
import type { PetListItem } from "@/types/pet";

interface Props {
  pets: PetListItem[];
}

export function OnboardingBanner({ pets }: Props) {
  const incomplete = pets.filter(
    (p) => p.is_active && p.onboarding_completion_percentage < 100,
  );

  if (incomplete.length === 0) return null;

  const first = incomplete[0];
  const rest = incomplete.length - 1;

  return (
    <Link
      to={`/pets/${first.id}/edit`}
      className="group block rounded-xl border border-accent/40 bg-accent/10 p-3 transition-colors hover:bg-accent/20"
    >
      <div className="flex items-center gap-3">
        <PetAvatar name={first.name} photo={first.photo} size="sm" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">
              Completa el perfil de {first.name}
              {rest > 0 && ` y ${rest} más`}
            </p>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={first.onboarding_completion_percentage}
              className="h-1.5 flex-1"
            />
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {first.onboarding_completion_percentage}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
