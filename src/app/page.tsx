import { SiteHeader, SiteFooter, Container, Eyebrow } from "@/components/meet";
import { EnterCode } from "./EnterCode";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1, display: "flex", alignItems: "center", padding: "48px 0" }}>
        <Container style={{ maxWidth: 760 }}>
          <Eyebrow>The Student Program</Eyebrow>
          <h1 style={{ marginTop: 16, fontSize: 44, color: "var(--meet-cream)" }}>
            Your <span className="text-teal">experience</span> shapes the program.
          </h1>
          <p style={{ marginTop: 18, maxWidth: 620, color: "var(--fg-muted)", fontSize: 17 }}>
            This survey helps <strong className="meet-word">meet</strong> understand what is working and what to
            improve. It takes about ten minutes. Your answers are <strong>anonymous</strong> — they are never linked
            to your name — and each student submits once.
          </p>

          <div style={{ marginTop: 36, maxWidth: 440 }}>
            <EnterCode />
          </div>

          <p style={{ marginTop: 28, color: "var(--fg-subtle)", fontSize: 13, maxWidth: 560 }}>
            Use the access code your coordinator gave you. If your link looks like{" "}
            <code style={{ color: "var(--fg-muted)" }}>/s/ABC123</code>, you can open it directly.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
