# meet — Student Evaluations

A web app for MEET's annual student program evaluations. Students fill out anonymous
surveys; the educational team and board view a dashboard that compares results to
targets and prior years, with automatic highlight/trend analysis powered by Claude.

Built on the **MEET Design System** (Archer + Proxima Nova, navy/teal/cream palette).
In partnership with MIT.

## Stack
- **Next.js** (App Router, TypeScript) + Tailwind, deployed on **Vercel**
- **Supabase** (Postgres + RLS) for storage and admin auth
- **Anthropic API** (Claude) for the dashboard's trend analysis

## The five surveys
Y1 Summer · Y1 End-of-Yearlong · Y2 Summer · Y2 End-of-Yearlong · Y3 Summer — drawing
from a shared bank of 69 questions across 5 segments (Computer Science, Entrepreneurship,
Startups & Status Quo, Deeper Understanding, Regional Dialogue). The canonical bank lives
in [`survey-questions.json`](./survey-questions.json) (parsed from the educational team's
spreadsheet); the database is seeded from it.

## How it works
- **Students** open `/s/<code>` (or enter a code on the home page), answer demographics
  (gender, community) + the survey, and submit once. Responses are anonymous — a used
  access code is never stored against a response.
- **Staff** sign in at `/admin` with **Google SSO** (access limited to the emails in
  `ADMIN_EMAILS` / `ADMIN_EMAIL_DOMAIN`):
  - **Cycles** — create a survey-in-a-year, open/close it, generate one-time access codes
    (downloadable as CSV with per-student links).
  - **Targets & history** — paste CSV of per-question targets and prior-year results.
  - **Dashboard** — per-segment and per-question favorable %, vs-target and vs-previous-year,
    demographic breakdowns, and a Claude-generated analysis of highlights and trends.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in keys (Supabase keys + ANTHROPIC_API_KEY)
# apply the schema (Supabase SQL editor or `supabase db push`)
npm run seed -- --demo       # questions + demo cycles/targets/history
npm run dev
```

## Environment variables
| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | bypasses RLS; never expose |
| `ANTHROPIC_API_KEY` | server only | trend analysis |
| `ANTHROPIC_MODEL` | server only | defaults to `claude-opus-4-8` |

## Database
Schema: [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
Anonymous submission is handled by the `submit_survey` `SECURITY DEFINER` function, which
validates a one-time token and writes the response atomically. RLS denies all other anon
access; admin reads run server-side with the service role.

Admin auth is **Google SSO** via Supabase. In the Supabase dashboard enable the Google
provider and add your site + `…/auth/callback` to the allowed redirect URLs. Authorization
is enforced by `ADMIN_EMAILS` (and optional `ADMIN_EMAIL_DOMAIN`).

Scripts:
- `npm run seed` — questions + survey membership (idempotent). `-- --demo` adds sample data.
- `npm run create-admin` — optional, for email/password accounts (not needed for SSO).
