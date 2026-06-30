"use client";
import { useState } from "react";

export interface TrendPoint {
  label: string;
  v: number;
}

/** Collapsed by default to keep the question list calm. Hover the toggle for a
    quick text tooltip; click to expand the multi-year sparkline. */
export function QuestionTrend({ points }: { points: TrendPoint[] }) {
  const [open, setOpen] = useState(false);
  if (points.length < 2) return null;

  const span = Math.round((points[points.length - 1].v - points[0].v) * 10) / 10;
  const up = span >= 0;
  const color = up ? "var(--meet-teal)" : "var(--meet-red)";
  const seriesText = points.map((p) => `${p.label} ${p.v}%`).join("  →  ");

  const w = 120;
  const h = 26;
  const xs = (i: number) => (i / (points.length - 1)) * (w - 4) + 2;
  const ys = (v: number) => h - 3 - (v / 100) * (h - 6);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(p.v).toFixed(1)}`).join(" ");

  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Trend: ${seriesText}`}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 11,
          color: "var(--fg-subtle)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-body)",
        }}
      >
        <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 120ms" }}>▸</span>
        {points.length - 1}-year trend
      </button>
      {open && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <svg width={w} height={h} style={{ overflow: "visible" }}>
            <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={xs(i)}
                cy={ys(p.v)}
                r={i === points.length - 1 ? 2.6 : 1.7}
                fill={i === points.length - 1 ? color : "var(--fg-subtle)"}
              />
            ))}
          </svg>
          <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
            {points.map((p) => `${p.label} ${p.v}`).join(" → ")}{" "}
            <span style={{ color, fontWeight: 700 }}>
              ({up ? "+" : ""}
              {span}pp)
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
