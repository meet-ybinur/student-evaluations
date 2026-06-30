"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "palestinian", label: "Palestinian" },
  { key: "israeli", label: "Israeli" },
];

export function DemographicToggle({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(key: string) {
    const p = new URLSearchParams(params.toString());
    if (key === "all") p.delete("demo");
    else p.set("demo", key);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {OPTIONS.map((o) => {
        const active = current === o.key || (o.key === "all" && !current);
        return (
          <button
            key={o.key}
            onClick={() => select(o.key)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              padding: "7px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: `1px solid ${active ? "var(--meet-teal)" : "var(--stroke-on-navy)"}`,
              background: active ? "var(--meet-teal)" : "transparent",
              color: active ? "var(--meet-navy)" : "var(--meet-cream)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
