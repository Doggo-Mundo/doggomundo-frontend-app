import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import {
  useMySegmentation,
  useSegmentationQuestions,
  useSubmitSegmentation,
} from "@/api/hooks/use-segmentation";
import { dismissSegmentationBanner } from "@/features/segmentation/banner-dismiss";
import { consumeFirstPetPending } from "@/lib/onboarding-flags";
import type { SegmentationAnswers } from "@/types/segmentation";

/**
 * One-question-per-screen survey for archetype segmentation.
 *
 * Pre-fills answers when the user has a prior submission (retake
 * flow from profile). Skip button dismisses the reminder banner
 * for 30 days and sends the user home. Final submit primes the
 * /me/ cache so the banner disappears immediately.
 */
export function SegmentationSurveyPage() {
  const navigate = useNavigate();
  const questions = useSegmentationQuestions();
  const existing = useMySegmentation();
  const submit = useSubmitSegmentation();

  // Seed answers from an existing profile on first load (retake).
  // Undefined means "not answered in this session yet".
  const initialAnswers = useMemo<Partial<SegmentationAnswers>>(() => {
    const p = existing.data;
    if (!p) return {};
    return {
      q1: p.q1_answer,
      q2: p.q2_answer,
      q3: p.q3_answer,
      q4: p.q4_answer,
      q5: p.q5_answer,
    };
  }, [existing.data]);

  const [answers, setAnswers] = useState<Partial<SegmentationAnswers>>({});
  // React Compiler-safe way to hydrate state once when the query resolves:
  // apply initial only if the local state is empty.
  const effectiveAnswers = Object.keys(answers).length
    ? answers
    : initialAnswers;

  const [step, setStep] = useState(0);

  if (questions.isLoading || existing.isLoading) {
    return <LoadingState rows={3} />;
  }

  if (questions.isError || !questions.data) {
    return (
      <EmptyState
        title="No pudimos cargar el cuestionario"
        description="Intenta de nuevo en unos segundos."
      />
    );
  }

  const qs = questions.data.questions;
  const total = qs.length;
  const current = qs[step];
  const currentAnswer =
    effectiveAnswers[current.key as keyof SegmentationAnswers];
  const canAdvance = !!currentAnswer;
  const isLast = step === total - 1;

  function pick(optionKey: string) {
    setAnswers((prev) => ({
      // Preserve any prior-round answers from retake seed on first
      // pick — after the first pick this becomes a normal setState.
      ...(Object.keys(answers).length ? prev : initialAnswers),
      [current.key]: optionKey,
    }));
  }

  function goBack() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  async function goNext() {
    if (!canAdvance) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    // Final submit — validated in _finalPayload; TS narrows once
    // we've verified all 5 keys are present.
    const complete = effectiveAnswers as SegmentationAnswers;
    try {
      await submit.mutateAsync(complete);
      toast.success(
        "¡Gracias! Vamos a personalizar tu experiencia.",
      );
      dismissSegmentationBanner(); // no need for the banner anymore
      continueOnboarding();
    } catch {
      toast.error("No pudimos guardar tus respuestas. Intenta de nuevo.");
    }
  }

  function skip() {
    // Dismiss the reminder banner for 30 days; user is choosing
    // "not now", not "never" — the profile page still has a link
    // to come back.
    dismissSegmentationBanner();
    toast("Sin problema, puedes contestar más adelante desde tu perfil.");
    continueOnboarding();
  }

  function continueOnboarding() {
    // Consume the pet flag if the user just came from registration
    // so the next onboarding step (adding their first pet) runs
    // without a detour through the empty dashboard. Existing users
    // reaching this page via the banner have no flag → land on /.
    if (consumeFirstPetPending()) {
      navigate("/pets/new", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 py-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pregunta {step + 1} de {total}
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-primary hover:underline"
          >
            Saltar por ahora
          </button>
        </div>
        <Progress value={((step + 1) / total) * 100} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">
            {current.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {current.options.map((opt) => {
            const selected = currentAnswer === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => pick(opt.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/60 hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {selected && <CheckCircle2 className="h-4 w-4" />}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 0}
        >
          Anterior
        </Button>
        <Button
          type="button"
          onClick={goNext}
          disabled={!canAdvance || submit.isPending}
        >
          {isLast
            ? submit.isPending
              ? "Guardando…"
              : "Terminar"
            : "Siguiente"}
        </Button>
      </div>

      {step === 0 && !existing.data && (
        // LFPDPPP micro-copy on the first screen only — enough to
        // give clear intent without spamming every page of the flow.
        <p className="text-center text-xs text-muted-foreground">
          Usaremos esta información para personalizar tu experiencia.
          Puedes actualizarla o eliminarla en cualquier momento desde
          tu perfil.
        </p>
      )}
    </div>
  );
}
