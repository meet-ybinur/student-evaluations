"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/meet";

export function EnterCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim();
        if (c) router.push(`/s/${encodeURIComponent(c)}`);
      }}
      style={{ display: "flex", gap: 10 }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your access code"
        aria-label="Access code"
        style={{
          flex: 1,
          fontFamily: "var(--font-body)",
          fontSize: 16,
          padding: "12px 16px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--stroke-on-navy)",
          background: "var(--meet-navy-deep)",
          color: "var(--meet-cream)",
        }}
      />
      <Button type="submit">Start</Button>
    </form>
  );
}
