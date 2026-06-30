import "server-only";
import { createAdminClient } from "./supabase/admin";
import { SURVEY_BY_KEY, type ResponseType, type SurveyKey } from "./survey-data";

export interface SurveyQuestion {
  id: number;
  segment: string;
  display_text: string;
  response_type: ResponseType;
  baseline: boolean;
}

export type SurveyLoad =
  | { status: "invalid" }
  | { status: "used" }
  | { status: "closed" }
  | {
      status: "ok";
      cycleId: string;
      surveyKey: SurveyKey;
      title: string;
      label: string;
      questions: SurveyQuestion[];
    };

export async function getSurveyByToken(token: string): Promise<SurveyLoad> {
  const db = createAdminClient();
  const { data: tok } = await db
    .from("access_tokens")
    .select("id, used, cycle_id")
    .eq("token", token)
    .maybeSingle();

  if (!tok) return { status: "invalid" };
  if (tok.used) return { status: "used" };

  const { data: cycle } = await db
    .from("cycles")
    .select("id, survey_key, label, status")
    .eq("id", tok.cycle_id)
    .single();
  if (!cycle) return { status: "invalid" };
  if (cycle.status !== "open") return { status: "closed" };

  const surveyKey = cycle.survey_key as SurveyKey;
  const { data: sq } = await db
    .from("survey_questions")
    .select("position, questions(id, segment, display_text, response_type, baseline)")
    .eq("survey_key", surveyKey)
    .order("position", { ascending: true });

  const questions: SurveyQuestion[] = (sq ?? [])
    .map((row) => {
      // supabase returns the joined row as an object or array depending on the relation
      const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
      return q as unknown as SurveyQuestion;
    })
    .filter(Boolean);

  return {
    status: "ok",
    cycleId: cycle.id,
    surveyKey,
    title: SURVEY_BY_KEY[surveyKey]?.title ?? cycle.label,
    label: cycle.label,
    questions,
  };
}
