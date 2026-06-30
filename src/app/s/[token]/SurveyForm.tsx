"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgramIcon } from "@/components/meet";
import { LIKERT_OPTIONS, RATING_OPTIONS, ZONE_OPTIONS, SEGMENTS } from "@/lib/survey-data";
import type { SurveyQuestion } from "@/lib/survey-fetch";

type AnswerVal = { num?: number; text?: string; choice?: string };

const ICON_BY_SEGMENT: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.name, s.icon]));

type Step =
  | { kind: "about" }
  | { kind: "segment"; name: string; qs: SurveyQuestion[] };

export function SurveyForm({
  token,
  title,
  label,
  questions,
}: {
  token: string;
  title: string;
  label: string;
  questions: SurveyQuestion[];
}) {
  const router = useRouter();
  const [gender, setGender] = useState<string>("");
  const [nationality, setNationality] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, AnswerVal>>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Build steps: About you, then one step per segment.
  const steps = useMemo<Step[]>(() => {
    const order = SEGMENTS.map((s) => s.name);
    const grouped: Record<string, SurveyQuestion[]> = {};
    for (const q of questions) (grouped[q.segment] ??= []).push(q);
    const segs = Object.entries(grouped).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    return [{ kind: "about" }, ...segs.map(([name, qs]) => ({ kind: "segment" as const, name, qs }))];
  }, [questions]);

  const required = questions.filter((q) => q.response_type !== "open_text");
  const answeredCount = required.filter((q) => {
    const a = answers[q.id];
    return a && (a.num != null || a.choice != null);
  }).length;
  const demoDone = !!gender && !!nationality;
  const progress = Math.round(((answeredCount + (demoDone ? 1 : 0)) / (required.length + 1)) * 100);

  function setAnswer(id: number, val: AnswerVal) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...val } }));
  }

  function isAnswered(q: SurveyQuestion) {
    const a = answers[q.id];
    return q.response_type === "open_text" || (a != null && (a.num != null || a.choice != null));
  }

  /** Returns the element id of the first unanswered item in the current step, or null. */
  function firstMissingInStep(s: Step): string | null {
    if (s.kind === "about") {
      if (!gender || !nationality) return "demographics";
      return null;
    }
    const q = s.qs.find((q) => !isAnswered(q));
    return q ? `q-${q.id}` : null;
  }

  function goNext() {
    const current = steps[step];
    const missing = firstMissingInStep(current);
    if (missing) {
      setShowErrors(true);
      setError(current.kind === "about" ? "Please answer both questions to continue." : "Please answer all questions in this section.");
      document.getElementById(missing)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    setShowErrors(false);
    if (step === steps.length - 1) {
      submit();
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError(null);
    setShowErrors(false);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    const payload = {
      token,
      gender,
      nationality,
      answers: questions.map((q) => {
        const a = answers[q.id] ?? {};
        return { question_id: q.id, num: a.num ?? null, text: a.text ?? null, choice: a.choice ?? null };
      }),
    };
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "invalid_or_used_token"
            ? "This survey has already been submitted."
            : "Something went wrong submitting your survey. Please try again.",
        );
        setSubmitting(false);
        return;
      }
      router.push("/thank-you");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const sectionLabel = current.kind === "about" ? "About you" : current.name;

  return (
    <div>
      {/* Header */}
      <div>
        <div className="font-display" style={{ color: "var(--meet-teal)", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {label}
        </div>
        <h1 style={{ fontSize: 30, marginTop: 8, color: "var(--meet-cream)" }}>{title}</h1>
      </div>

      {/* Progress */}
      <div style={{ padding: "16px 0", marginTop: 8, borderBottom: "1px solid var(--stroke-on-navy)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-muted)" }}>
          <span>
            Section {step + 1} of {steps.length} · {sectionLabel}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div style={{ height: 6, background: "var(--meet-navy-deep)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--meet-teal)", transition: "width 200ms" }} />
        </div>
      </div>

      {/* Step content */}
      <div className="meet-enter" key={step} style={{ minHeight: 280 }}>
        {current.kind === "about" ? (
          <section id="demographics" style={{ marginTop: 28 }}>
            <h3 style={{ color: "var(--meet-cream)" }}>About you</h3>
            <p style={{ color: "var(--fg-muted)", fontSize: 14, marginTop: 8, maxWidth: 560 }}>
              Answer honestly — there are no right answers. Your responses are anonymous and help{" "}
              <strong className="meet-word">meet</strong> improve the program. These two questions are used only for grouped
              analysis and are never linked to your identity.
            </p>
            <div style={{ marginTop: 22 }}>
              <ChoiceField
                legend="Gender"
                value={gender}
                onChange={setGender}
                invalid={showErrors && !gender}
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <ChoiceField
                legend="Community"
                value={nationality}
                onChange={setNationality}
                invalid={showErrors && !nationality}
                options={[
                  { value: "palestinian", label: "Palestinian" },
                  { value: "israeli", label: "Israeli" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </section>
        ) : (
          <section style={{ marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--stroke-on-navy)" }}>
              {ICON_BY_SEGMENT[current.name] && <ProgramIcon name={ICON_BY_SEGMENT[current.name]} size={26} />}
              <h3 style={{ color: "var(--meet-cream)" }}>{current.name}</h3>
            </div>
            {current.qs.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswer(q.id, v)}
                invalid={showErrors && q.response_type !== "open_text" && !isAnswered(q)}
              />
            ))}
          </section>
        )}
      </div>

      {/* Nav */}
      <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {step > 0 && (
          <Button variant="secondary" onClick={goBack} disabled={submitting}>
            Back
          </Button>
        )}
        <Button onClick={goNext} disabled={submitting}>
          {submitting ? "Submitting…" : isLast ? "Submit survey" : "Next section"}
        </Button>
        {error && <span style={{ color: "var(--meet-red)", fontSize: 14 }}>{error}</span>}
      </div>
    </div>
  );
}

function ChoiceField({
  legend,
  options,
  value,
  onChange,
  invalid,
}: {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontSize: 14, color: invalid ? "var(--meet-red)" : "var(--fg-muted)", marginBottom: 8 }}>{legend}</legend>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                padding: "9px 16px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${active ? "var(--meet-teal)" : "var(--stroke-on-navy)"}`,
                background: active ? "var(--meet-teal)" : "var(--meet-navy-deep)",
                color: active ? "var(--meet-navy)" : "var(--meet-cream)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function QuestionRow({
  q,
  value,
  onChange,
  invalid,
}: {
  q: SurveyQuestion;
  value: AnswerVal | undefined;
  onChange: (v: AnswerVal) => void;
  invalid?: boolean;
}) {
  return (
    <div id={`q-${q.id}`} style={{ padding: "20px 0", borderBottom: "1px solid rgba(254,251,244,0.07)" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <p style={{ color: invalid ? "var(--meet-red)" : "var(--meet-cream)", fontSize: 16, fontWeight: 500 }}>{q.display_text}</p>
      </div>
      <div style={{ marginTop: 14 }}>
        {(q.response_type === "likert5" || q.response_type === "rating5") && (
          <ScaleInput
            options={q.response_type === "likert5" ? LIKERT_OPTIONS : RATING_OPTIONS}
            value={value?.num ?? null}
            onChange={(num) => onChange({ num })}
          />
        )}
        {q.response_type === "zone" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ZONE_OPTIONS.map((o) => {
              const active = value?.choice === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange({ choice: o.value })}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${active ? "var(--meet-teal)" : "var(--stroke-on-navy)"}`,
                    background: active ? "var(--meet-teal)" : "var(--meet-navy-deep)",
                    color: active ? "var(--meet-navy)" : "var(--meet-cream)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
        {q.response_type === "open_text" && (
          <textarea
            value={value?.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Your answer (optional)"
            rows={3}
            style={{
              width: "100%",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--stroke-on-navy)",
              background: "var(--meet-navy-deep)",
              color: "var(--meet-cream)",
              resize: "vertical",
            }}
          />
        )}
      </div>
    </div>
  );
}

function ScaleInput({
  options,
  value,
  onChange,
}: {
  options: { value: number; label: string }[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  // Display high-to-low (5 -> 1).
  const ordered = options.slice().reverse();
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {ordered.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              minWidth: 44,
              padding: "10px 14px",
              borderRadius: 8,
              cursor: "pointer",
              border: `1px solid ${active ? "var(--meet-teal)" : "var(--stroke-on-navy)"}`,
              background: active ? "var(--meet-teal)" : "var(--meet-navy-deep)",
              color: active ? "var(--meet-navy)" : "var(--meet-cream)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontWeight: 700 }}>{o.value}</span>
            <span style={{ fontSize: 11, opacity: 0.85 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
