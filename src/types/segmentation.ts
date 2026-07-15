/** Types for the customer archetype segmentation flow.
 *
 *  Source of truth (server-side): backend/src/accounts/segmentation.py
 *  Feature plan: backend/docs/ARQUETIPOS_SEGMENTATION_PLAN.md */

export type ArchetypeCode = "A1" | "A2" | "A2.1" | "A3" | "A4" | "A5";

export const ARCHETYPE_LABEL: Record<ArchetypeCode, string> = {
  A1: "La Delegadora",
  A2: "El Compañero Inseparable",
  "A2.1": "El Guardián Ansioso",
  A3: "El Profesional Multitarea",
  A4: "El Cachorro Curioso",
  A5: "El Aliado Profesional",
};

export interface SegmentationOption {
  key: string;
  label: string;
}

export interface SegmentationQuestion {
  key: string;
  prompt: string;
  options: SegmentationOption[];
}

export interface SegmentationQuestionsResponse {
  questions: SegmentationQuestion[];
}

/** Answers as submitted — one option key per question. */
export type SegmentationAnswers = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
};

export interface SegmentationProfile {
  id: string;
  primary_archetypes: ArchetypeCode[];
  secondary_archetype: ArchetypeCode | "";
  scores: Record<ArchetypeCode, number>;
  q1_answer: string;
  q2_answer: string;
  q3_answer: string;
  q4_answer: string;
  q5_answer: string;
  created_at: string;
  updated_at: string;
}
