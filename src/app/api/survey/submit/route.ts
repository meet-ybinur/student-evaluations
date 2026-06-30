import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface AnswerIn {
  question_id: number;
  num: number | null;
  text: string | null;
  choice: string | null;
}

export async function POST(req: Request) {
  let body: { token?: string; gender?: string; nationality?: string; answers?: AnswerIn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { token, gender, nationality, answers } = body;
  if (!token || !Array.isArray(answers)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("submit_survey", {
    p_token: token,
    p_gender: gender ?? null,
    p_nationality: nationality ?? null,
    p_answers: answers,
  });

  if (error) {
    const msg = error.message?.includes("invalid_or_used_token")
      ? "invalid_or_used_token"
      : error.message?.includes("cycle_not_open")
      ? "cycle_not_open"
      : "submit_failed";
    const status = msg === "submit_failed" ? 500 : 409;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true, sessionId: data });
}
