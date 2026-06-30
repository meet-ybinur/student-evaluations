"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgramIcon } from "@/components/meet";
import { LIKERT_OPTIONS, RATING_OPTIONS, ZONE_OPTIONS, SEGMENTS } from "@/lib/survey-data";
import type { SurveyQuestion } from "@/lib/survey-fetch";

type AnswerVal = { num?: number; text?: string; choice?: string };

const ICON_BY_SEGMENT: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.name, s.icon]));

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const segments = useMemo(() => {
    const order = SEGMENTS.map((s) => s.name);
    const grouped: Record<string, SurveyQuestion[]> = {};
    for (const q of questions) (grouped[q.segment] ??= []).push(q);
    return Object.entries(grouped).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
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

  function firstUnanswered(): number | null {
    if (!demoDone) return -1;
    const q = required.find((q) => {
      const a = answers[q.id];
      return !(a && (a.num != null || a.choice != null));
    });
    return q ? q.id : null;
  }

  async function submit() {
    setShowErrors(true);
    const missing = firstUnanswered();
    if (missing !== null) {
      setError("Please answer all questions before submitting.");
      const el = document.getElementById(missing === -1 ? "demographics" : `q-${missing}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
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

  return (
    <div>
      {/* Header */}
      <div>
        <div className="font-display" style={{ color: "var(--meet-teal)", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {label}
        </div>
        <h1 style={{ fontSize: 34, marginTop: 8, color: "var(--meet-cream)" }}>{title}</h1>
        <p style={{ marginTop: 12, color: "var(--fg-muted)", maxWidth: 620 }}>
          Answer honestly — there are no right answers. Your responses are anonymous and help{" "}
          <strong className="meet-word">meet</strong> improve the program.
        </p>
      </div>

      {/* Sticky progress */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--meet-navy)",
          padding: "14px 0",
          marginTop: 16,
          borderBottom: "1px solid var(--stroke-on-navy)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-muted)" }}>
          <span>{progress}% complete</span>
          <span>
            {answeredCount}/{required.length} questions
          </span>
        </div>
        <div style={{ height: 6, background: "var(--meet-navy-deep)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--meet-teal)", transition: "width 200ms" }} />
        </div>
      </div>

      {/* Demographics */}
      <section id="demographics" style={{ marginTop: 32 }}>
        <h3 style={{ color: "var(--meet-cream)" }}>About you</h3>
        <p style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 6 }}>
          Used only for grouped analysis. Never linked to your identity.
        </p>
        <div style={{ marginTop: 18 }}>
          <ChoiceField
            legend="Gender"
            value={gender}
            onChange={setGender}
            invalid={showErrors && !gender}
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "other", label: "Other" },
              { value: "prefer_not", label: "Prefer not to say" },
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
              { value: "prefer_not", label: "Prefer not to say" },
            ]}
          />
        </div>
      </section>

      {/* Questions by segment */}
      {segments.map(([segment, qs]) => (
        <section key={segment} style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--stroke-on-navy)" }}>
            {ICON_BY_SEGMENT[segment] && <ProgramIcon name={ICON_BY_SEGMENT[segment]} size={26} />}
            <h3 style={{ color: "var(--meet-cream)" }}>{segment}</h3>
          </div>
          {qs.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              value={answers[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
              invalid={showErrors && q.response_type !== "open_text" && !(answers[q.id]?.num != null || answers[q.id]?.choice != null)}
            />
          ))}
        </section>
      ))}

      {/* Submit */}
      <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit survey"}
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
        <p style={{ color: invalid ? "var(--meet-red)" : "var(--meet-cream)", fontSize: 16, fontWeight: 500 }}>
          {q.display_text}
          {q.baseline && (
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--fg-subtle)", verticalAlign: "middle" }}>baseline</span>
          )}
        </p>
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
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
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
