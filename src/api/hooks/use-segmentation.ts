import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  SegmentationAnswers,
  SegmentationProfile,
  SegmentationQuestionsResponse,
} from "@/types/segmentation";

export const segmentationKeys = {
  questions: ["segmentation", "questions"] as const,
  me: ["segmentation", "me"] as const,
};

export function useSegmentationQuestions() {
  return useQuery({
    queryKey: segmentationKeys.questions,
    queryFn: () =>
      api
        .get<SegmentationQuestionsResponse>("/auth/segmentation/questions/")
        .then((r) => r.data),
    // Questions are hardcoded in the backend; never change during a
    // session. Cache aggressively.
    staleTime: Infinity,
  });
}

/** Current user's segmentation profile. Returns `null` (not error)
 *  when the user hasn't completed the survey yet — the reminder
 *  banner + survey redirect key off that. */
export function useMySegmentation() {
  return useQuery({
    queryKey: segmentationKeys.me,
    queryFn: async (): Promise<SegmentationProfile | null> => {
      try {
        const { data } = await api.get<SegmentationProfile>(
          "/auth/segmentation/me/",
        );
        return data;
      } catch (err) {
        // 404 is the "not yet completed" signal — normalize to null
        // so callers don't have to try/catch.
        if (
          typeof err === "object"
          && err !== null
          && "response" in err
          && (err as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw err;
      }
    },
    // Cheap to refetch on window focus — user might complete the
    // survey in another tab.
    staleTime: 30_000,
  });
}

export function useSubmitSegmentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: SegmentationAnswers) =>
      api
        .post<SegmentationProfile>("/auth/segmentation/submit/", answers)
        .then((r) => r.data),
    onSuccess: (data) => {
      // Prime the /me/ cache so the banner disappears immediately
      // and downstream reads see the fresh profile without a fetch.
      qc.setQueryData(segmentationKeys.me, data);
    },
  });
}
