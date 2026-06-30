/* MEET brand component library.
   Ported from the MEET Design System (claude_design 033ce4ee-…):
   ChevronPill / StatTile / IconPillar geometry and the Header lock-up
   are faithful to the one-pager UI kit. Colors/type come from tokens.css. */
import React from "react";
import Link from "next/link";

/* ---------- Logo ---------- */
export function MeetLogo({
  height = 28,
  tone = "cream",
}: {
  height?: number;
  tone?: "cream" | "navy" | "teal";
}) {
  // The shipped PNG is navy on transparent. Filter to the requested tone.
  const filter =
    tone === "cream"
      ? "brightness(0) invert(1)"
      : tone === "teal"
      ? // navy -> teal
        "brightness(0) saturate(100%) invert(64%) sepia(38%) saturate(450%) hue-rotate(133deg) brightness(92%) contrast(85%)"
      : "none";
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logos/meet-logo.png"
      alt="meet"
      style={{ height, width: "auto", objectFit: "contain", filter, display: "block" }}
    />
  );
}

/* ---------- MIT partnership lock-up ---------- */
export function MITLockup({ tone = "cream" }: { tone?: "cream" | "navy" }) {
  const color = tone === "cream" ? "var(--meet-cream)" : "var(--meet-navy)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
          color,
          textAlign: "right",
        }}
      >
        In partnership
        <br />
        with
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/mit-logo.svg"
        alt="MIT"
        style={{ height: 16, filter: tone === "cream" ? "brightness(0) invert(1)" : "none" }}
      />
    </div>
  );
}

/* ---------- Site header (app chrome) ---------- */
export function SiteHeader({ tagline = true, href = "/" }: { tagline?: boolean; href?: string }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px var(--page-pad)",
        borderBottom: "1px solid var(--stroke-on-navy)",
      }}
    >
      <Link href={href} style={{ borderBottom: "none", display: "flex", alignItems: "center", gap: 16 }}>
        <MeetLogo height={26} />
        {tagline && (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              color: "var(--meet-cream)",
              maxWidth: 160,
            }}
          >
            the middle east
            <br />
            entrepreneurs of tomorrow
          </span>
        )}
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 1, height: 26, background: "rgba(254,251,244,0.4)" }} />
        <MITLockup />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "24px var(--page-pad)",
        borderTop: "1px solid var(--stroke-on-navy)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>
        meet — the middle east entrepreneurs of tomorrow · in partnership with MIT
      </span>
      <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>Responses are anonymous.</span>
    </footer>
  );
}

/* ---------- Chevron pill (signature MEET shape) ---------- */
function chevronPath(w: number, h: number) {
  const r = h * 0.16;
  const point = h * 0.5;
  const tipW = h * 0.5;
  const bodyW = w - tipW;
  return `M 0 ${r} C 0 ${r / 2} ${r / 2} 0 ${r} 0 L ${bodyW} 0 L ${w} ${point} L ${bodyW} ${h} L ${r} ${h} C ${r / 2} ${h} 0 ${h - r / 2} 0 ${h - r} Z`;
}

export function ChevronPill({
  label,
  width = 182,
  height = 44,
  fill = "var(--meet-cream)",
  color = "var(--meet-navy)",
  fontSize = 15,
}: {
  label: React.ReactNode;
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
  fontSize?: number;
}) {
  return (
    <div style={{ position: "relative", width, height, display: "inline-block" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <path d={chevronPath(width, height)} fill={fill} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingRight: height * 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          color,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ---------- Stat tile (deep-navy capsule) ---------- */
export function StatTile({
  number,
  label,
  accent = "cream",
}: {
  number: React.ReactNode;
  label: string;
  accent?: "cream" | "teal" | "red";
}) {
  const numColor =
    accent === "teal" ? "var(--meet-teal)" : accent === "red" ? "var(--meet-red)" : "var(--meet-cream)";
  return (
    <div
      style={{
        background: "var(--meet-navy-deep)",
        borderRadius: 8,
        border: "1px solid var(--stroke-on-navy)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 96,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: numColor,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 11,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: "rgba(254,251,244,0.78)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ---------- Icon pillar ---------- */
const ICON_TEAL_FILTER =
  "brightness(0) saturate(100%) invert(72%) sepia(38%) saturate(450%) hue-rotate(133deg) brightness(89%) contrast(80%)";

export function ProgramIcon({ name, size = 32 }: { name: string; size?: number }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`/icons/${name}.svg`}
      alt=""
      style={{ width: size, height: size, objectFit: "contain", filter: ICON_TEAL_FILTER }}
    />
  );
}

/* ---------- Buttons ---------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};
export function Button({ variant = "primary", style, children, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "-0.01em",
    padding: "12px 22px",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    transition: "all var(--dur-base) var(--ease-out)",
    border: "1px solid transparent",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--meet-teal)", color: "var(--meet-navy)" },
    secondary: { background: "transparent", color: "var(--meet-cream)", borderColor: "var(--stroke-on-navy)" },
    ghost: { background: "transparent", color: "var(--meet-teal)", padding: "8px 12px" },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...(rest.disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}), ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({
  children,
  style,
  surface = "navy",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  surface?: "navy" | "cream";
}) {
  const surfaceStyle: React.CSSProperties =
    surface === "cream"
      ? { background: "var(--meet-cream)", color: "var(--meet-navy)", border: "1px solid var(--stroke-on-cream)" }
      : { background: "var(--meet-navy-deep)", color: "var(--meet-cream)", border: "1px solid var(--stroke-on-navy)" };
  return (
    <div style={{ borderRadius: "var(--radius-md)", padding: 24, ...surfaceStyle, ...style }}>{children}</div>
  );
}

/* ---------- Eyebrow + container ---------- */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--meet-teal)",
      }}
    >
      {children}
    </div>
  );
}

export function Container({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--page-pad)", width: "100%", ...style }}>
      {children}
    </div>
  );
}
