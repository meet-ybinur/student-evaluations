"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Container, MeetLogo, Button } from "@/components/meet";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized"
      ? "That account isn't authorized for the evaluation dashboard."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "var(--font-body)",
    fontSize: 16,
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid var(--stroke-on-navy)",
    background: "var(--meet-navy-deep)",
    color: "var(--meet-cream)",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
      <Container style={{ maxWidth: 400 }}>
        <MeetLogo height={30} />
        <h1 style={{ fontSize: 30, marginTop: 24, color: "var(--meet-cream)" }}>Staff sign-in</h1>
        <p style={{ color: "var(--fg-muted)", marginTop: 8, fontSize: 14 }}>
          Evaluation dashboard — meet educational team.
        </p>
        <form onSubmit={onSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          {error && <span style={{ color: "var(--meet-red)", fontSize: 14 }}>{error}</span>}
        </form>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
