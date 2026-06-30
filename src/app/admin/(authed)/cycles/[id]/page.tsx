import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCycle } from "@/lib/admin-data";
import { setCycleStatus, generateTokensFromForm } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function CyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await getCycle(id);
  if (!cycle) notFound();

  const db = createAdminClient();
  const { data: tokens } = await db
    .from("access_tokens")
    .select("token, used")
    .eq("cycle_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  const unused = (tokens ?? []).filter((t) => !t.used);

  return (
    <div>
      <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
        ← All cycles
      </Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 30, color: "var(--meet-cream)" }}>{cycle.label}</h1>
        <Link href={`/admin/dashboard/${id}`} style={primaryLink}>
          View dashboard
        </Link>
      </div>

      {/* Status */}
      <section style={card}>
        <h3 style={h3}>Status</h3>
        <p style={muted}>
          Current: <strong style={{ color: "var(--meet-cream)" }}>{cycle.status}</strong>. Students can submit only while a cycle is{" "}
          <strong>open</strong>.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {(["draft", "open", "closed"] as const).map((s) => (
            <form key={s} action={setCycleStatus.bind(null, id, s)}>
              <button
                type="submit"
                disabled={cycle.status === s}
                style={{
                  ...pill,
                  background: cycle.status === s ? "var(--meet-teal)" : "var(--meet-navy)",
                  color: cycle.status === s ? "var(--meet-navy)" : "var(--meet-cream)",
                  cursor: cycle.status === s ? "default" : "pointer",
                }}
              >
                {s === "open" ? "Open" : s === "closed" ? "Close" : "Draft"}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Tokens */}
      <section style={card}>
        <h3 style={h3}>Access codes</h3>
        <p style={muted}>
          Generate one code per student. Each code can be used once. Distribute the link{" "}
          <code style={{ color: "var(--fg-muted)" }}>/s/CODE</code> or have students enter the code on the home page.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
          <form action={generateTokensFromForm.bind(null, id)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input name="count" type="number" defaultValue={120} min={1} max={500} style={input} />
            <button type="submit" style={primaryBtn}>
              Generate codes
            </button>
          </form>
          <a href={`/api/admin/tokens?cycleId=${id}`} style={ghostLink}>
            Download all as CSV
          </a>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--fg-muted)" }}>
          {tokens?.length ?? 0} codes · {unused.length} unused
        </div>
        {unused.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              maxHeight: 160,
              overflow: "auto",
              fontFamily: "var(--font-body)",
            }}
          >
            {unused.slice(0, 60).map((t) => (
              <span
                key={t.token}
                style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--meet-navy)",
                  border: "1px solid var(--stroke-on-navy)",
                  letterSpacing: "0.05em",
                }}
              >
                {t.token}
              </span>
            ))}
            {unused.length > 60 && <span style={{ ...muted, alignSelf: "center" }}>+{unused.length - 60} more (in CSV)</span>}
          </div>
        )}
      </section>
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 22,
  background: "var(--meet-navy-deep)",
  border: "1px solid var(--stroke-on-navy)",
  borderRadius: 8,
  padding: 22,
};
const h3: React.CSSProperties = { color: "var(--meet-cream)", fontSize: 18 };
const muted: React.CSSProperties = { color: "var(--fg-muted)", fontSize: 14, marginTop: 6 };
const input: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--stroke-on-navy)",
  background: "var(--meet-navy)",
  color: "var(--meet-cream)",
  width: 100,
};
const pill: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  padding: "9px 18px",
  borderRadius: 999,
  border: "1px solid var(--stroke-on-navy)",
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
const primaryLink: React.CSSProperties = { ...primaryBtn, textDecoration: "none", borderBottom: "none" };
const ghostLink: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  padding: "11px 18px",
  borderRadius: 999,
  border: "1px solid var(--stroke-on-navy)",
  color: "var(--meet-cream)",
  borderBottom: "1px solid var(--stroke-on-navy)",
};
