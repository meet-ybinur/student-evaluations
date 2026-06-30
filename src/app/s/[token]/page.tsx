import Link from "next/link";
import { SiteHeader, SiteFooter, Container } from "@/components/meet";
import { getSurveyByToken } from "@/lib/survey-fetch";
import { SurveyForm } from "./SurveyForm";

export const dynamic = "force-dynamic";

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <Container style={{ maxWidth: 620 }}>
          <h1 style={{ fontSize: 36, color: "var(--meet-cream)" }}>{title}</h1>
          <p style={{ marginTop: 16, color: "var(--fg-muted)", fontSize: 17 }}>{body}</p>
          <p style={{ marginTop: 24 }}>
            <Link href="/">Back to start</Link>
          </p>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const load = await getSurveyByToken(decodeURIComponent(token));

  if (load.status === "invalid")
    return <Notice title="That code isn't valid" body="Please check the access code from your coordinator and try again." />;
  if (load.status === "used")
    return (
      <Notice
        title="This survey was already submitted"
        body="Each access code can be used once. If you think this is a mistake, contact your coordinator."
      />
    );
  if (load.status === "closed")
    return <Notice title="This survey is closed" body="The response window for this survey has ended. Thank you." />;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <SiteHeader tagline={false} />
      <main style={{ flex: 1, padding: "32px 0 64px" }}>
        <Container style={{ maxWidth: 760 }}>
          <SurveyForm
            token={decodeURIComponent(token)}
            title={load.title}
            label={load.label}
            questions={load.questions}
          />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
