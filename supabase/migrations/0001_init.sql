-- ============================================================
-- MEET Student Evaluations — initial schema
-- Anonymous surveys, one submission per access token, with
-- targets + historical results powering the dashboard.
-- ============================================================

-- ---------- Question bank ----------
create table if not exists questions (
  id            integer primary key,
  segment       text not null,
  text          text not null,
  display_text  text not null,
  baseline      boolean not null default false,
  tag           text,
  response_type text not null default 'likert5'
                  check (response_type in ('likert5','rating5','zone','open_text'))
);

-- Which questions belong to which survey, and in what order.
create table if not exists survey_questions (
  survey_key   text not null,
  question_id  integer not null references questions(id) on delete cascade,
  position     integer not null,
  primary key (survey_key, question_id)
);
create index if not exists survey_questions_key_idx on survey_questions(survey_key, position);

-- ---------- Cycles: a survey administered in a given year ----------
create table if not exists cycles (
  id          uuid primary key default gen_random_uuid(),
  survey_key  text not null,
  year        integer not null,
  label       text not null,
  status      text not null default 'draft' check (status in ('draft','open','closed')),
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (survey_key, year)
);
create index if not exists cycles_status_idx on cycles(status);

-- ---------- Access tokens: enforce one anonymous submission each ----------
create table if not exists access_tokens (
  id         uuid primary key default gen_random_uuid(),
  cycle_id   uuid not null references cycles(id) on delete cascade,
  token      text not null unique,
  used       boolean not null default false,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists access_tokens_cycle_idx on access_tokens(cycle_id);

-- ---------- Responses (anonymous; NOT linked to a token) ----------
create table if not exists response_sessions (
  id           uuid primary key default gen_random_uuid(),
  cycle_id     uuid not null references cycles(id) on delete cascade,
  gender       text check (gender in ('female','male','other','prefer_not')),
  nationality  text check (nationality in ('palestinian','israeli','other','prefer_not')),
  submitted_at timestamptz not null default now()
);
create index if not exists response_sessions_cycle_idx on response_sessions(cycle_id);

create table if not exists answers (
  id           bigint generated always as identity primary key,
  session_id   uuid not null references response_sessions(id) on delete cascade,
  question_id  integer not null references questions(id),
  value_num    integer,
  value_text   text,
  value_choice text
);
create index if not exists answers_session_idx on answers(session_id);
create index if not exists answers_question_idx on answers(question_id);

-- ---------- Targets ----------
create table if not exists targets (
  id           bigint generated always as identity primary key,
  question_id  integer not null references questions(id) on delete cascade,
  survey_key   text,                         -- null => applies to all surveys
  metric       text not null default 'favorable_pct',
  target_value numeric not null,
  unique (question_id, survey_key, metric)
);

-- ---------- Historical results (prior years, from data file) ----------
create table if not exists historical_results (
  id          bigint generated always as identity primary key,
  survey_key  text not null,
  year        integer not null,
  question_id integer not null references questions(id) on delete cascade,
  metric      text not null default 'favorable_pct',
  value       numeric not null,
  n           integer,
  unique (survey_key, year, question_id, metric)
);

-- ---------- Cached LLM analysis ----------
create table if not exists analysis_runs (
  id         uuid primary key default gen_random_uuid(),
  cycle_id   uuid not null references cycles(id) on delete cascade,
  model      text not null,
  summary    text not null,
  highlights jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analysis_runs_cycle_idx on analysis_runs(cycle_id, created_at desc);

-- ============================================================
-- Submission RPC — validates the token and writes the response
-- atomically. SECURITY DEFINER so anon can submit without any
-- direct table write privileges. Anonymity: the used token is
-- flipped but never stored against the session row.
-- ============================================================
create or replace function submit_survey(
  p_token       text,
  p_gender      text,
  p_nationality text,
  p_answers     jsonb   -- [{ "question_id": 1, "num": 4 } | { "question_id": 60, "text": "..." } | { "question_id": 16, "choice": "learning" }]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle_id uuid;
  v_session_id uuid;
  v_item jsonb;
begin
  -- Lock + validate token.
  select cycle_id into v_cycle_id
  from access_tokens
  where token = p_token and used = false
  for update;

  if v_cycle_id is null then
    raise exception 'invalid_or_used_token' using errcode = 'P0001';
  end if;

  -- Cycle must be open.
  if not exists (select 1 from cycles where id = v_cycle_id and status = 'open') then
    raise exception 'cycle_not_open' using errcode = 'P0001';
  end if;

  insert into response_sessions (cycle_id, gender, nationality)
  values (v_cycle_id, p_gender, p_nationality)
  returning id into v_session_id;

  for v_item in select * from jsonb_array_elements(p_answers)
  loop
    insert into answers (session_id, question_id, value_num, value_text, value_choice)
    values (
      v_session_id,
      (v_item->>'question_id')::integer,
      nullif(v_item->>'num','')::integer,
      nullif(v_item->>'text',''),
      nullif(v_item->>'choice','')
    );
  end loop;

  update access_tokens set used = true, used_at = now() where token = p_token;

  return v_session_id;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table questions          enable row level security;
alter table survey_questions   enable row level security;
alter table cycles             enable row level security;
alter table access_tokens      enable row level security;
alter table response_sessions  enable row level security;
alter table answers            enable row level security;
alter table targets            enable row level security;
alter table historical_results enable row level security;
alter table analysis_runs      enable row level security;

-- Public read of the (non-sensitive) survey structure so the survey can render.
create policy "public read questions" on questions for select to anon using (true);
create policy "public read survey_questions" on survey_questions for select to anon using (true);
create policy "public read open cycles" on cycles for select to anon using (status = 'open');

-- Everything else: no anon access at all. Admin runs server-side with the
-- service role (which bypasses RLS). The submit RPC handles anon writes.
grant execute on function submit_survey(text, text, text, jsonb) to anon;
