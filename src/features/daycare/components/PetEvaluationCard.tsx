import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PetAvatar } from "@/features/pets/components/PetAvatar";
import { usePetProfile, useRequestEvaluation } from "@/api/hooks/use-daycare";
import { extractDaycareError } from "@/features/daycare/lib/extract-error";
import { cn } from "@/lib/utils";
import type { PetListItem } from "@/types/pet";

interface Props {
  pet: PetListItem;
}

export function PetEvaluationCard({ pet }: Props) {
  const { data: profile, isLoading } = usePetProfile(pet.id);
  const request = useRequestEvaluation(pet.id);

  async function handleRequest() {
    try {
      await request.mutateAsync();
      toast.success(
        `Solicitud enviada para ${pet.name}. Te avisamos cuando esté lista.`,
      );
    } catch (err) {
      toast.error(extractDaycareError(err));
    }
  }

  const status = profile?.evaluation_status ?? "not_requested";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-3">
        <PetAvatar name={pet.name} photo={pet.photo} size="sm" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">{pet.name}</p>
            {profile && (
              <StatusPill status={status} label={profile.evaluation_status_display} />
            )}
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Cargando…</p>
          ) : (
            <StatusBody
              status={status}
              notes={profile?.evaluation_notes ?? ""}
              onRequest={handleRequest}
              isRequesting={request.isPending}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Sub-components ----------

interface StatusPillProps {
  status: string;
  label: string;
}

function StatusPill({ status, label }: StatusPillProps) {
  const tone =
    status === "approved" || status === "conditional"
      ? "bg-primary/10 text-primary"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : status === "pending"
          ? "bg-accent/10 text-accent-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone,
      )}
    >
      {label}
    </span>
  );
}

interface StatusBodyProps {
  status: string;
  notes: string;
  onRequest: () => void;
  isRequesting: boolean;
}

function StatusBody({ status, notes, onRequest, isRequesting }: StatusBodyProps) {
  if (status === "not_requested") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Antes de reservar, agenda una evaluación de temperamento.
        </p>
        <Button size="sm" onClick={onRequest} disabled={isRequesting}>
          {isRequesting ? "Enviando…" : "Solicitar evaluación"}
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Evaluación pendiente — te avisamos cuando esté lista.
      </p>
    );
  }

  if (status === "approved" || status === "conditional") {
    return (
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Listo para reservar
          {status === "conditional" && " (con condiciones)"}
        </p>
        {notes && (
          <p className="text-xs text-muted-foreground">{notes}</p>
        )}
        <Button asChild size="sm" variant="outline">
          <Link to="/daycare/book">Reservar día</Link>
        </Button>
      </div>
    );
  }

  // rejected
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle className="h-3.5 w-3.5" />
        Evaluación no aprobada
      </p>
      {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
    </div>
  );
}
