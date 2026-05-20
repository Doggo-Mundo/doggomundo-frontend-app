import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Sun,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePetProfile, useRequestEvaluation } from "@/api/hooks/use-daycare";
import { extractDaycareError } from "@/features/daycare/lib/extract-error";

interface Props {
  petId: string;
  petName: string;
}

export function PetDaycareSection({ petId, petName }: Props) {
  const { data: profile, isLoading } = usePetProfile(petId);
  const request = useRequestEvaluation(petId);

  async function handleRequest() {
    try {
      await request.mutateAsync();
      toast.success(`Solicitud enviada para ${petName}.`);
    } catch (err) {
      toast.error(extractDaycareError(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-4 w-4 text-accent-foreground" />
          Doggo Day Care
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : !profile || profile.evaluation_status === "not_requested" ? (
          <>
            <p className="text-muted-foreground">
              Para que {petName} pueda asistir al day care, agenda una
              evaluación de temperamento.
            </p>
            <Button size="sm" onClick={handleRequest} disabled={request.isPending}>
              {request.isPending ? "Enviando…" : "Solicitar evaluación"}
            </Button>
          </>
        ) : profile.evaluation_status === "pending" ? (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Evaluación pendiente — te avisamos cuando esté lista.
          </p>
        ) : profile.evaluation_status === "approved" ||
          profile.evaluation_status === "conditional" ? (
          <>
            <p className="flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprobado
              {profile.evaluation_status === "conditional" && " (con condiciones)"}
            </p>
            {profile.evaluation_notes && (
              <p className="text-xs text-muted-foreground">
                {profile.evaluation_notes}
              </p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link to="/daycare/book">
                Reservar en Doggo Day Care
                <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Evaluación no aprobada
            </p>
            {profile.evaluation_notes && (
              <p className="text-xs text-muted-foreground">
                {profile.evaluation_notes}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
