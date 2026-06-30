import { createAdminClient } from "@/lib/supabase/admin";
import { SURVEYS, getQuestionBank } from "@/lib/survey-data";
import { importTargets, importHistorical } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const db = createAdminClient();
  const [{ count: targetCount }, { count: histCount }] = await Promise.all([
    db.from("targets").select("id", { count: "exact", head: true }),
    db.from("historical_results").select("id", { count: "exact", head: true }),
  ]);
  const bank = getQuestionBank();

  return (
    <div>
      <h1 style={{ fontSize: 32, color: "var(--meet-cream)" }}>Targets &amp; history</h1>
      <p style={{ color: "var(--fg-muted)", marginTop: 8, maxWidth: 720 }}>
        Paste CSV from your board spreadsheet. Targets and prior-year results are keyed to <strong>question id</strong>{" "}
        (see the reference table below). Importing upserts — re-paste to update.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24, alignItems: "start" }}>
        {/* Targets */}
        <form action={importTargets} style={cardStyle}>
          <h3 style={h3}>Targets ({targetCount ?? 0})</h3>
          <p style={muted}>
            Columns: <code style={code}>question_id,survey_key,target_value</code>. Leave <code style={code}>survey_key</code> blank to
            apply a target to every survey. <code style={code}>target_value</code> is the favorable-% goal.
          </p>
          <textarea
            name="csv"
            rows={10}
            placeholder={"question_id,survey_key,target_value\n9,,80\n54,Y2_summer,90"}
            style={textarea}
          />
          <button type="submit" style={primaryBtn}>
            Import targets
          </button>
        </form>

        {/* Historical */}
        <form action={importHistorical} style={cardStyle}>
          <h3 style={h3}>Prior-year results ({histCount ?? 0})</h3>
          <p style={muted}>
            Columns: <code style={code}>survey_key,year,question_id,value,n</code>. <code style={code}>value</code> is the favorable %
            for that year; <code style={code}>n</code> is optional respondent count.
          </p>
          <textarea
            name="csv"
            rows={10}
            placeholder={"survey_key,year,question_id,value,n\nY1_summer,2025,9,78,112"}
            style={textarea}
          />
          <button type="submit" style={primaryBtn}>
            Import history
          </button>
        </form>
      </div>

      <p style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 16 }}>
        Survey keys: {SURVEYS.map((s) => s.key).join(", ")}
      </p>

      {/* Question reference */}
      <h3 style={{ ...h3, marginTop: 32 }}>Question id reference</h3>
      <div style={{ marginTop: 12, overflow: "auto", border: "1px solid var(--stroke-on-navy)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--fg-muted)" }}>
              <th style={th}>id</th>
              <th style={th}>segment</th>
              <th style={th}>question</th>
              <th style={th}>type</th>
            </tr>
          </thead>
          <tbody>
            {bank.map((q) => (
              <tr key={q.id} style={{ borderTop: "1px solid rgba(254,251,244,0.07)" }}>
                <td style={{ ...td, color: "var(--meet-teal)", fontWeight: 700 }}>{q.id}</td>
                <td style={td}>{q.segment}</td>
                <td style={{ ...td, color: "var(--meet-cream)" }}>{q.displayText}</td>
                <td style={{ ...td, color: "var(--fg-subtle)" }}>{q.responseType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--meet-navy-deep)",
  border: "1px solid var(--stroke-on-navy)",
  borderRadius: 8,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const h3: React.CSSProperties = { color: "var(--meet-cream)", fontSize: 18 };
const muted: React.CSSProperties = { color: "var(--fg-muted)", fontSize: 13 };
const code: React.CSSProperties = { color: "var(--meet-teal)", fontSize: 12 };
const textarea: React.CSSProperties = {
  width: "100%",
  fontFamily: "monospace",
  fontSize: 13,
  padding: 12,
  borderRadius: 8,
  border: "1px solid var(--stroke-on-navy)",
  background: "var(--meet-navy)",
  color: "var(--meet-cream)",
  resize: "vertical",
};
const primaryBtn: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  background: "var(--meet-teal)",
  color: "var(--meet-navy)",
  cursor: "pointer",
  alignSelf: "start",
};
const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 700, position: "sticky", top: 0, background: "var(--meet-navy-deep)" };
const td: React.CSSProperties = { padding: "8px 12px", verticalAlign: "top", color: "var(--fg-muted)" };
