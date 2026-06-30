import Link from "next/link";
import { MeetLogo } from "@/components/meet";
import { requireAdmin } from "@/lib/admin-data";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--stroke-on-navy)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/admin" style={{ borderBottom: "none" }}>
            <MeetLogo height={22} />
          </Link>
          <nav style={{ display: "flex", gap: 18, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>
            <Link href="/admin" style={{ color: "var(--fg-muted)", borderBottom: "none" }}>
              Cycles
            </Link>
            <Link href="/admin/data" style={{ color: "var(--fg-muted)", borderBottom: "none" }}>
              Targets &amp; history
            </Link>
          </nav>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            style={{ background: "transparent", border: "none", color: "var(--fg-muted)", cursor: "pointer", fontSize: 13 }}
          >
            Sign out
          </button>
        </form>
      </header>
      <main style={{ flex: 1, padding: "32px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
