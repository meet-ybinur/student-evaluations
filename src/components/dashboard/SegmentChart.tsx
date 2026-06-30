"use client";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export interface SegmentDatum {
  segment: string;
  favorable: number | null;
  target: number | null;
}

export function SegmentChart({ data }: { data: SegmentDatum[] }) {
  const rows = data.filter((d) => d.favorable != null);
  return (
    <div style={{ width: "100%", height: Math.max(160, rows.length * 56) }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 8 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="segment"
            width={150}
            tick={{ fill: "#FEFBF4", fontSize: 12, fontFamily: "Archer, Georgia, serif" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(254,251,244,0.05)" }}
            contentStyle={{ background: "#09313C", border: "1px solid rgba(254,251,244,0.15)", borderRadius: 8, color: "#FEFBF4" }}
            formatter={(v: number) => [`${v}% favorable`, "Result"]}
          />
          <ReferenceLine x={80} stroke="rgba(254,251,244,0.25)" strokeDasharray="3 3" />
          <Bar dataKey="favorable" radius={[0, 4, 4, 0]} barSize={22}>
            {rows.map((d, i) => (
              <Cell key={i} fill={d.target != null && d.favorable! >= d.target ? "#42B6B4" : "#E0A23C"} />
            ))}
            <LabelList
              dataKey="favorable"
              position="right"
              formatter={(v: number) => `${v}%`}
              style={{ fill: "#FEFBF4", fontSize: 12, fontFamily: "Archer, Georgia, serif", fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
