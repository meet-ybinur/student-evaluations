import { SiteHeader, SiteFooter, Container, ChevronPill } from "@/components/meet";

export default function ThankYouPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <Container style={{ maxWidth: 640 }}>
          <h1 style={{ fontSize: 44, color: "var(--meet-cream)" }}>
            Thank you<span className="text-teal">.</span>
          </h1>
          <p style={{ marginTop: 18, color: "var(--fg-muted)", fontSize: 17, maxWidth: 560 }}>
            Your responses have been recorded anonymously. What you shared helps{" "}
            <strong className="meet-word">meet</strong> understand your experience and keep building a program worthy
            of its students.
          </p>
          <div style={{ marginTop: 32 }}>
            <ChevronPill label="Palestinians and Israelis, shaping the future together" width={420} height={44} fontSize={14} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
