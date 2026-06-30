/* Aggregation helpers for the dashboard. Computes per-question metrics from
   raw answers + session demographics, and joins them to targets + history. */
import { isFavorable, type ResponseType } from "./survey-data";

export interface RawSession {
  id: string;
  gender: string | null;
  nationality: string | null;
}
export interface RawAnswer {
  session_id: string;
  question_id: number;
  value_num: number | null;
  value_text: string | null;
  value_choice: string | null;
}
export interface QuestionMeta {
  id: number;
  segment: string;
  display_text: string;
  response_type: ResponseType;
  baseline: boolean;
}

export interface QuestionMetrics {
  questionId: number;
  n: number;
  favorablePct: number | null; // null for open_text
  mean: number | null; // for likert/rating
  distribution: Record<string, number>; // value -> count
  textResponses: string[]; // for open_text
}

export type DemographicKey = "all" | "female" | "male" | "palestinian" | "israeli";

function answerValue(type: ResponseType, a: RawAnswer): number | string | null {
  if (type === "zone") return a.value_choice;
  if (type === "open_text") return a.value_text;
  return a.value_num;
}

export function computeMetrics(
  q: QuestionMeta,
  answers: RawAnswer[],
  sessions: Map<string, RawSession>,
  demo: DemographicKey = "all",
): QuestionMetrics {
  const filtered = answers.filter((a) => {
    if (a.question_id !== q.id) return false;
    if (demo === "all") return true;
    const s = sessions.get(a.session_id);
    if (!s) return false;
    if (demo === "female" || demo === "male") return s.gender === demo;
    return s.nationality === demo;
  });

  const dist: Record<string, number> = {};
  const texts: string[] = [];
  let favCount = 0;
  let valued = 0;
  let sum = 0;
  let numCount = 0;

  for (const a of filtered) {
    const v = answerValue(q.response_type, a);
    if (q.response_type === "open_text") {
      if (typeof v === "string" && v.trim()) texts.push(v.trim());
      continue;
    }
    if (v == null || v === "") continue;
    valued++;
    dist[String(v)] = (dist[String(v)] ?? 0) + 1;
    if (isFavorable(q.response_type, v)) favCount++;
    if (typeof v === "number") {
      sum += v;
      numCount++;
    }
  }

  return {
    questionId: q.id,
    n: q.response_type === "open_text" ? texts.length : valued,
    favorablePct: q.response_type === "open_text" ? null : valued ? round1((favCount / valued) * 100) : null,
    mean: numCount ? round1(sum / numCount) : null,
    distribution: dist,
    textResponses: texts,
  };
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export interface QuestionComparison {
  questionId: number;
  segment: string;
  text: string;
  baseline: boolean;
  responseType: ResponseType;
  current: QuestionMetrics;
  target: number | null;
  vsTarget: number | null; // current.favorablePct - target
  history: { year: number; value: number; n: number | null }[];
  vsPrevYear: number | null; // current - most recent prior year
}

export interface DashboardData {
  comparisons: QuestionComparison[];
  bySegment: Record<string, QuestionComparison[]>;
  totalResponses: number;
  demographics: { gender: Record<string, number>; nationality: Record<string, number> };
}

export function buildDashboard(params: {
  questions: QuestionMeta[];
  answers: RawAnswer[];
  sessions: RawSession[];
  surveyKey: string;
  targets: { question_id: number; survey_key: string | null; target_value: number }[];
  history: { survey_key: string; year: number; question_id: number; value: number; n: number | null }[];
  demo?: DemographicKey;
}): DashboardData {
  const { questions, answers, sessions, surveyKey, targets, history, demo = "all" } = params;
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const targetFor = (qid: number): number | null => {
    const specific = targets.find((t) => t.question_id === qid && t.survey_key === surveyKey);
    const general = targets.find((t) => t.question_id === qid && t.survey_key == null);
    return (specific ?? general)?.target_value ?? null;
  };

  const comparisons: QuestionComparison[] = questions.map((q) => {
    const current = computeMetrics(q, answers, sessionMap, demo);
    const target = targetFor(q.id);
    const hist = history
      .filter((h) => h.question_id === q.id && h.survey_key === surveyKey)
      .sort((a, b) => a.year - b.year)
      .map((h) => ({ year: h.year, value: h.value, n: h.n }));
    const prev = hist.length ? hist[hist.length - 1].value : null;
    return {
      questionId: q.id,
      segment: q.segment,
      text: q.display_text,
      baseline: q.baseline,
      responseType: q.response_type,
      current,
      target,
      vsTarget: current.favorablePct != null && target != null ? round1(current.favorablePct - target) : null,
      history: hist,
      vsPrevYear: current.favorablePct != null && prev != null ? round1(current.favorablePct - prev) : null,
    };
  });

  const bySegment: Record<string, QuestionComparison[]> = {};
  for (const c of comparisons) (bySegment[c.segment] ??= []).push(c);

  const gender: Record<string, number> = {};
  const nationality: Record<string, number> = {};
  for (const s of sessions) {
    if (s.gender) gender[s.gender] = (gender[s.gender] ?? 0) + 1;
    if (s.nationality) nationality[s.nationality] = (nationality[s.nationality] ?? 0) + 1;
  }

  return {
    comparisons,
    bySegment,
    totalResponses: sessions.length,
    demographics: { gender, nationality },
  };
}

/** Segment-level favorable average (mean of question favorable %s). */
export function segmentFavorable(comparisons: QuestionComparison[]): number | null {
  const vals = comparisons.map((c) => c.current.favorablePct).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
}
