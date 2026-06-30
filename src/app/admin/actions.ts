"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-data";
import { SURVEY_BY_KEY, type SurveyKey } from "@/lib/survey-data";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function makeToken(len = 8) {
  let s = "";
  for (let i = 0; i < len; i++) s += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  return s;
}

export async function createCycle(formData: FormData) {
  await requireAdmin();
  const survey_key = String(formData.get("survey_key")) as SurveyKey;
  const year = Number(formData.get("year"));
  if (!SURVEY_BY_KEY[survey_key] || !year) return;
  const db = createAdminClient();
  const label = `${SURVEY_BY_KEY[survey_key].short} ${year}`;
  const { data } = await db
    .from("cycles")
    .upsert({ survey_key, year, label, status: "draft" }, { onConflict: "survey_key,year" })
    .select()
    .single();
  revalidatePath("/admin");
  if (data) redirect(`/admin/cycles/${data.id}`);
}

export async function setCycleStatus(cycleId: string, status: "draft" | "open" | "closed") {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("cycles").update({ status }).eq("id", cycleId);
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/admin");
}

export async function generateTokens(cycleId: string, count: number) {
  await requireAdmin();
  const db = createAdminClient();
  const n = Math.max(1, Math.min(500, count || 0));
  const rows = Array.from({ length: n }, () => ({ cycle_id: cycleId, token: makeToken() }));
  // unique constraint handles the rare collision; retry once on conflict
  const { error } = await db.from("access_tokens").insert(rows);
  if (error) {
    // regenerate and retry once
    const retry = Array.from({ length: n }, () => ({ cycle_id: cycleId, token: makeToken(9) }));
    await db.from("access_tokens").insert(retry);
  }
  revalidatePath(`/admin/cycles/${cycleId}`);
}

export async function generateTokensFromForm(cycleId: string, formData: FormData) {
  const count = Number(formData.get("count")) || 0;
  await generateTokens(cycleId, count);
}

/** CSV: question_id,survey_key,target_value  (survey_key blank => all surveys) */
export async function importTargets(formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("csv") ?? "").trim();
  if (!text) return;
  const db = createAdminClient();
  const rows = parseCsv(text);
  const upserts = rows
    .map((r) => ({
      question_id: Number(r.question_id),
      survey_key: r.survey_key?.trim() ? r.survey_key.trim() : null,
      metric: "favorable_pct",
      target_value: Number(r.target_value),
    }))
    .filter((r) => r.question_id && !Number.isNaN(r.target_value));
  if (upserts.length) await db.from("targets").upsert(upserts, { onConflict: "question_id,survey_key,metric" });
  revalidatePath("/admin/data");
}

/** CSV: survey_key,year,question_id,value,n */
export async function importHistorical(formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("csv") ?? "").trim();
  if (!text) return;
  const db = createAdminClient();
  const rows = parseCsv(text);
  const upserts = rows
    .map((r) => ({
      survey_key: r.survey_key?.trim(),
      year: Number(r.year),
      question_id: Number(r.question_id),
      metric: "favorable_pct",
      value: Number(r.value),
      n: r.n ? Number(r.n) : null,
    }))
    .filter((r) => r.survey_key && r.year && r.question_id && !Number.isNaN(r.value));
  if (upserts.length)
    await db.from("historical_results").upsert(upserts, { onConflict: "survey_key,year,question_id,metric" });
  revalidatePath("/admin/data");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* Minimal CSV parser (header row + comma-separated, quoted fields supported). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}
