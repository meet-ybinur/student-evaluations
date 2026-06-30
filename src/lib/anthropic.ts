import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { segmentFavorable, type DashboardData } from "./aggregate";

export interface Highlight {
  type: "win" | "concern" | "movement" | "gap" | "trend";
  title: string;
  detail: string;
}
export interface AnalysisResult {
  summary: string;
  highlights: Highlight[];
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** Build a compact, token-efficient view of the dashboard for the model. */
function buildContext(title: string, data: DashboardData) {
  const segments = Object.entries(data.bySegment).map(([segment, comps]) => ({
    segment,
    favorable_avg: segmentFavorable(comps),
    questions: comps
      .filter((c) => c.current.favorablePct != null)
      .map((c) => ({
        q: c.text,
        baseline: c.baseline || undefined,
        favorable: c.current.favorablePct,
        n: c.current.n,
        target: c.target,
        vs_target: c.vsTarget,
        prev_years: c.history.map((h) => ({ year: h.year, favorable: h.value })),
        vs_prev_year: c.vsPrevYear,
      })),
  }));
  return {
    survey: title,
    total_responses: data.totalResponses,
    demographics: data.demographics,
    segments,
  };
}

export async function analyzeDashboard(title: string, data: DashboardData): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const context = buildContext(title, data);

  const system = [
    "You are an evaluation analyst for MEET (the middle east entrepreneurs of tomorrow), a non-profit that brings",
    "together young Palestinian and Israeli leaders, in partnership with MIT. You are analysing anonymous student",
    "survey results for the educational team and board.",
    "",
    "Metrics: 'favorable' is the percentage of students answering favorably (top-2-box on a 5-point agreement scale,",
    "or the 'learning zone' for zone questions). 'target' is the goal set by the team. 'vs_target' and 'vs_prev_year'",
    "are percentage-point differences (positive = above target / improved year-over-year).",
    "",
    "Tone: plain, considered, even-handed. No melodrama, no exclamation marks, no corporate jargon. Be specific and",
    "quantitative — cite the actual numbers and question wording. Treat Palestinians and Israelis with equal, precise",
    "language. Surface what genuinely stands out; do not invent findings the data does not support.",
    "",
    "Return ONLY valid JSON matching: {\"summary\": string (2-4 short paragraphs of markdown), \"highlights\":",
    "[{\"type\": \"win\"|\"concern\"|\"movement\"|\"gap\"|\"trend\", \"title\": string, \"detail\": string}]}.",
    "Aim for 5-9 highlights covering: the strongest results, the biggest gaps below target, the largest year-over-year",
    "movements (up and down), and any cross-segment or demographic pattern worth the team's attention.",
  ].join("\n");

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2200,
    system,
    messages: [
      {
        role: "user",
        content: `Here is the survey result data as JSON. Analyse it and return the JSON object described.\n\n${JSON.stringify(
          context,
        )}`,
      },
    ],
  });

  const text = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  return parseResult(text);
}

function parseResult(text: string): AnalysisResult {
  // tolerate code fences / stray prose around the JSON
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const json = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    const parsed = JSON.parse(json);
    return {
      summary: String(parsed.summary ?? ""),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 12) : [],
    };
  } catch {
    return { summary: text, highlights: [] };
  }
}

export { MODEL as ANALYSIS_MODEL };
