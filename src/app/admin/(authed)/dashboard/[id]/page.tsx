import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/admin-data";
import { segmentFavorable, type DemographicKey, type QuestionComparison } from "@/lib/aggregate";
import { SEGMENT_ORDER } from "@/lib/survey-data";
import { StatTile } from "@/components/meet";
import { DemographicToggle } from "@/components/dashboard/DemographicToggle";
import { SegmentChart } from "@/components/dashboard/SegmentChart";
import { AnalysisPanel } from "@/components/dashboard/AnalysisPanel";
import { QuestionTrend } from "@/components/dashboard/QuestionTrend";

export const dynamic = "force-dynamic";

const VALID_DEMO = ["all", "female", "male", "palestinian", "israeli"];

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const { demo: demoParam } = await searchParams;
  const demo = (VALID_DEMO.includes(demoParam ?? "") ? demoParam : "all") as DemographicKey;

  const dash = await getDashboardData(id, demo);
  if (!dash) notFound();
  const { cycle, data } = dash;

  // overall favorable across all scored questions
  const allComps = data.comparisons.filter((c) => c.current.favorablePct != null);
  const overall = allComps.length
    ? Math.round(allComps.reduce((a, c) => a + (c.current.favorablePct ?? 0), 0) / allComps.length)
    : null;
  const belowTarget = data.comparisons.filter((c) => c.vsTarget != null && c.vsTarget < 0).length;
  const improved = data.comparisons.filter((c) => c.vsPrevYear != null && c.vsPrevYear > 0).length;
  const declined = data.comparisons.filter((c) => c.vsPrevYear != null && c.vsPrevYear < 0).length;

  const segmentOrder = Object.keys(data.bySegment).sort(
    (a, b) => SEGMENT_ORDER.indexOf(a) - SEGMENT_ORDER.indexOf(b),
  );
  const chartData = segmentOrder.map((seg) => {
    const comps = data.bySegment[seg];
    const targets = comps.map((c) => c.target).filter((t): t is number => t != null);
    return {
      segment: seg,
      favorable: segmentFavorable(comps),
      target: targets.length ? Math.round(targets.reduce((a, b) => a + b, 0) / targets.length) : null,
    };
  });

  return (
    <div>
      <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
        ← All cycles
      </Link>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 10, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 32, color: "var(--meet-cream)" }}>{cycle.title}</h1>
          <p style={{ color: "var(--fg-muted)", marginTop: 4 }}>
            {cycle.year} · {cycle.status} · {data.totalResponses} responses
          </p>
        </div>
        <Link href={`/admin/cycles/${id}`} style={{ fontSize: 14 }}>
          Manage codes &amp; status
        </Link>
      </div>

      {data.totalResponses === 0 ? (
        <p style={{ color: "var(--fg-subtle)", marginTop: 32 }}>
          No responses yet. Open the cycle and distribute access codes; results appear here as students submit.
        </p>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <StatTile number={`${overall ?? "—"}%`} label="Overall favorable" accent="teal" />
            <StatTile number={data.totalResponses} label="Responses" />
            <StatTile number={belowTarget} label="Questions below target" accent={belowTarget ? "red" : "cream"} />
            <StatTile number={`+${improved}`} label="Improved vs last year" accent="teal" />
            <StatTile number={declined} label="Declined vs last year" accent={declined ? "red" : "cream"} />
          </div>

          {/* Demographic toggle */}
          <div style={{ marginTop: 28 }}>
            <div style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 8 }}>View results for</div>
            <DemographicToggle current={demo} />
          </div>

          {/* Segment overview */}
          <section style={{ marginTop: 28, background: "var(--meet-navy-deep)", border: "1px solid var(--stroke-on-navy)", borderRadius: 12, padding: 24 }}>
            <h3 style={{ color: "var(--meet-cream)", fontSize: 20 }}>Favorable by segment</h3>
            <p style={{ color: "var(--fg-subtle)", fontSize: 12, marginTop: 4 }}>
              Teal = meeting the segment target · amber = below. Dashed line marks 80%.
            </p>
            <div style={{ marginTop: 12 }}>
              <SegmentChart data={chartData} />
            </div>
          </section>

          {/* Analysis */}
          <section style={{ marginTop: 24 }}>
            <AnalysisPanel cycleId={id} hasResponses={data.totalResponses > 0} />
          </section>

          {/* Per-segment questions */}
          {segmentOrder.map((seg) => (
            <section key={seg} style={{ marginTop: 32 }}>
              <h3 style={{ color: "var(--meet-cream)", fontSize: 20, paddingBottom: 10, borderBottom: "1px solid var(--stroke-on-navy)" }}>
                {seg}
              </h3>
              <div style={{ marginTop: 8 }}>
                {data.bySegment[seg].map((c) => (
                  <QuestionRow key={c.questionId} c={c} year={cycle.year} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Chip({ value, suffix = "pp" }: { value: number | null; suffix?: string }) {
  if (value == null) return <span style={{ color: "var(--fg-subtle)", fontSize: 13 }}>—</span>;
  const positive = value >= 0;
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        color: positive ? "var(--meet-teal)" : "var(--meet-red)",
      }}
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function QuestionRow({ c, year }: { c: QuestionComparison; year: number }) {
  if (c.responseType === "open_text") {
    return (
      <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(254,251,244,0.07)" }}>
        <div style={{ color: "var(--meet-cream)", fontSize: 15 }}>{c.text}</div>
        <div style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 6 }}>{c.current.n} written responses</div>
        {c.current.textResponses.slice(0, 3).map((t, i) => (
          <div key={i} style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 6, fontStyle: "italic", paddingLeft: 12, borderLeft: "2px solid var(--stroke-on-navy)" }}>
            “{t}”
          </div>
        ))}
      </div>
    );
  }

  const fav = c.current.favorablePct;
  const target = c.target;
  const meets = fav != null && target != null && fav >= target;
  const trendPoints =
    fav != null && c.history.length
      ? [...c.history.map((h) => ({ label: `'${String(h.year).slice(2)}`, v: h.value })), { label: `'${String(year).slice(2)}`, v: fav }]
      : [];

  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(254,251,244,0.07)", display: "grid", gridTemplateColumns: "1fr 160px 90px 90px", gap: 16, alignItems: "center" }}>
      <div>
        <div style={{ color: "var(--meet-cream)", fontSize: 15 }}>{c.text}</div>
        {/* favorable bar with target marker */}
        <div style={{ position: "relative", height: 8, background: "var(--meet-navy)", borderRadius: 999, marginTop: 8, maxWidth: 360 }}>
          <div style={{ width: `${fav ?? 0}%`, height: "100%", background: meets ? "var(--meet-teal)" : "#E0A23C", borderRadius: 999 }} />
          {target != null && (
            <div style={{ position: "absolute", left: `${target}%`, top: -3, bottom: -3, width: 2, background: "var(--meet-cream)" }} title={`Target ${target}%`} />
          )}
        </div>
        <QuestionTrend points={trendPoints} />
      </div>
      <div>
        <span className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--meet-cream)" }}>
          {fav != null ? `${fav}%` : "—"}
        </span>
        <span style={{ color: "var(--fg-subtle)", fontSize: 12, marginLeft: 6 }}>n={c.current.n}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "var(--fg-subtle)", fontSize: 11 }}>vs target</div>
        <Chip value={c.vsTarget} />
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "var(--fg-subtle)", fontSize: 11 }}>vs last yr</div>
        <Chip value={c.vsPrevYear} />
      </div>
    </div>
  );
}
