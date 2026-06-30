/* Create (or update) a staff admin user via the Supabase Auth admin API.
 *
 *   ADMIN_EMAIL=you@meet.mit.edu ADMIN_PASSWORD='strong-pass' npm run create-admin
 *
 * Uses the service-role key — no database password required. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // create with email confirmed so they can sign in immediately
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message?.toLowerCase().includes("already")) {
      console.log(`User ${email} already exists — leaving as is.`);
      return;
    }
    throw error;
  }
  console.log(`✓ Admin created: ${data.user?.email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
