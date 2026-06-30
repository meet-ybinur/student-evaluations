"use client";
import { useEffect, useState } from "react";

interface Highlight {
  type: "win" | "concern" | "movement" | "gap" | "trend";
  title: string;
  detail: string;
}
interface Analysis {
  summary: string;
  highlights: Highlight[];
  model?: string;
  generatedAt?: string;
  created_at?: string;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  win: { label: "Strength", color: "var(--meet-teal)" },
  concern: { label: "Concern", color: "var(--meet-red)" },
  movement: { label: "Movement", color: "#E0A23C" },
  gap: { label: "Below target", color: "var(--meet-red)" },
  trend: { label: "Trend", color: "var(--meet-teal)" },
};

export function AnalysisPanel({ cycleId, hasResponses }: { cycleId: string; hasResponses: boolean }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedExisting, setLoadedExisting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/analyze?cycleId=${cycleId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.summary) setAnalysis(d);
      })
      .catch(() => {})
      .finally(() => setLoadedExisting(true));
  }, [cycleId]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "no_responses"
            ? "No responses yet to analyse."
            : json.error?.includes("ANTHROPIC")
            ? "The Anthropic API key isn't configured on the server."
            : "Analysis failed. Please try again.",
        );
      } else {
        setAnalysis(json);
      }
    } catch {
      setError("Network error running analysis.");
    } finally {
      setLoading(false);
    }
  }

  const when = analysis?.generatedAt || analysis?.created_at;

  return (
    <div style={{ background: "var(--meet-navy-deep)", border: "1px solid var(--stroke-on-navy)", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ color: "var(--meet-cream)", fontSize: 20 }}>Automatic analysis</h3>
          <p style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>
            Highlights and trends, generated with Claude from this cycle&apos;s results, targets and prior years.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading || !hasResponses}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            padding: "11px 20px",
            borderRadius: 999,
            border: "none",
            background: hasResponses ? "var(--meet-teal)" : "var(--meet-navy)",
            color: hasResponses ? "var(--meet-navy)" : "var(--fg-subtle)",
            cursor: loading || !hasResponses ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Analysing…" : analysis ? "Re-run analysis" : "Generate analysis"}
        </button>
      </div>

      {error && <p style={{ color: "var(--meet-red)", fontSize: 14, marginTop: 14 }}>{error}</p>}

      {!analysis && loadedExisting && !error && (
        <p style={{ color: "var(--fg-subtle)", fontSize: 14, marginTop: 16 }}>
          {hasResponses ? "No analysis yet — generate one to see highlights and trends." : "Collect responses first, then generate analysis."}
        </p>
      )}

      {analysis && (
        <div style={{ marginTop: 18 }}>
          {when && (
            <div style={{ color: "var(--fg-subtle)", fontSize: 12, marginBottom: 12 }}>
              Generated {new Date(when).toLocaleString()} {analysis.model ? `· ${analysis.model}` : ""}
            </div>
          )}
          <Markdown text={analysis.summary} />
          {analysis.highlights?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 20 }}>
              {analysis.highlights.map((h, i) => {
                const meta = TYPE_META[h.type] ?? { label: h.type, color: "var(--meet-teal)" };
                return (
                  <div key={i} style={{ background: "var(--meet-navy)", border: "1px solid var(--stroke-on-navy)", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {meta.label}
                    </div>
                    <div className="font-display" style={{ color: "var(--meet-cream)", fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                      {h.title}
                    </div>
                    <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{h.detail}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Minimal markdown: paragraphs, **bold**, and - bullets. */
function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: 18, color: "var(--fg-primary)" }}>
              {lines.map((l, j) => (
                <li key={j} style={{ marginBottom: 4, lineHeight: 1.45 }}>
                  <Inline text={l.replace(/^\s*[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        const heading = block.match(/^#{2,4}\s+(.*)$/);
        if (heading) {
          return (
            <h4 key={i} style={{ color: "var(--meet-cream)", fontSize: 17 }}>
              {heading[1]}
            </h4>
          );
        }
        return (
          <p key={i} style={{ color: "var(--fg-primary)", lineHeight: 1.5, fontSize: 15 }}>
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ color: "var(--meet-cream)" }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
