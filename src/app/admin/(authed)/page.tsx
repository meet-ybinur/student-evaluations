import Link from "next/link";
import { listCycles } from "@/lib/admin-data";
import { SURVEYS } from "@/lib/survey-data";
import { createCycle } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  open: "var(--meet-teal)",
  draft: "var(--fg-subtle)",
  closed: "var(--meet-gray)",
};

export default async function AdminHome() {
  const cycles = await listCycles();
  const thisYear = new Date().getFullYear();

  return (
    <div>
      <h1 style={{ fontSize: 32, color: "var(--meet-cream)" }}>Survey cycles</h1>
      <p style={{ color: "var(--fg-muted)", marginTop: 8 }}>
        Each cycle is one survey administered in one year. Open a cycle to manage access codes, then view its dashboard.
      </p>

      {/* Create */}
      <form
        action={createCycle}
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
          background: "var(--meet-navy-deep)",
          border: "1px solid var(--stroke-on-navy)",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--fg-muted)" }}>
          Survey
          <select name="survey_key" style={selectStyle} defaultValue={SURVEYS[0].key}>
            {SURVEYS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--fg-muted)" }}>
          Year
          <input name="year" type="number" defaultValue={thisYear} style={{ ...selectStyle, width: 110 }} />
        </label>
        <button type="submit" style={primaryBtn}>
          Create cycle
        </button>
      </form>

      {/* List */}
      <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
        {cycles.length === 0 && <p style={{ color: "var(--fg-subtle)" }}>No cycles yet. Create one above.</p>}
        {cycles.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              background: "var(--meet-navy-deep)",
              border: "1px solid var(--stroke-on-navy)",
              borderRadius: 8,
              padding: "16px 20px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--meet-cream)" }}>
                  {c.label}
                </span>
                <span style={{ fontSize: 12, color: STATUS_COLOR[c.status], textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
                {c.responses} responses · {c.tokensUsed}/{c.tokensTotal} codes used
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href={`/admin/cycles/${c.id}`} style={ghostLink}>
                Manage
              </Link>
              <Link href={`/admin/dashboard/${c.id}`} style={primaryLink}>
                Dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--stroke-on-navy)",
  background: "var(--meet-navy)",
  color: "var(--meet-cream)",
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
};
const primaryLink: React.CSSProperties = { ...primaryBtn, textDecoration: "none", borderBottom: "none", display: "inline-block" };
const ghostLink: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  padding: "11px 18px",
  borderRadius: 999,
  border: "1px solid var(--stroke-on-navy)",
  color: "var(--meet-cream)",
  borderBottomColor: "var(--stroke-on-navy)",
};
