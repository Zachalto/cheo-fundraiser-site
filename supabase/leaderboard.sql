-- Leaderboard for the cup stacking game.
-- This has already been run on the "cheo-leaderboard" Supabase project.
-- To set up a fresh project: dashboard > SQL Editor > New query > paste > Run.
--
-- What the public (the website) can do:
--   * read name, score and time of rows that are not flagged
--   * register that a round has started
--   * add a score for a round that started about a minute earlier and hasn't been used
-- What the public can NOT do:
--   * read homeroom, claim_code, flagged or flag_reason
--   * read the rounds table
--   * change or delete anything
--
-- Private columns on scores (only visible in the Supabase dashboard):
--   homeroom     optional, typed by the player, so organisers can find finalists
--   claim_code   made by the player's phone; a finalist shows the same code to prove a score is theirs
--   hits         cups landed that round, sent by the game
--   trap         a form field people can't see; only bots fill it in
--   flagged      true = hidden from the public board
--   flag_reason  why it was flagged
--
-- Flagging is quiet on purpose: the sender is told the post worked, but nobody sees it.
-- To hide a rude name yourself: Table Editor > scores > set flagged to true.
-- To un-hide a score you believe is real: set flagged to false.

create schema if not exists private;

-- ── Rounds ─────────────────────────────────────────────────
create table if not exists public.rounds (
  id uuid primary key,
  started_at timestamptz not null default now(),
  used boolean not null default false
);

alter table public.rounds enable row level security;
revoke all on public.rounds from anon, authenticated;
grant insert (id) on public.rounds to anon, authenticated;

drop policy if exists "Anyone can start a round" on public.rounds;
create policy "Anyone can start a round"
  on public.rounds for insert
  to anon, authenticated
  with check (true);

create or replace function private.rounds_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  -- The database sets the start time. The website can't choose it.
  new.started_at := now();
  new.used := false;
  select count(*) into recent from public.rounds where started_at > now() - interval '1 minute';
  if recent >= 200 then
    raise exception 'Too many rounds at once. Try again in a minute.';
  end if;
  return new;
end;
$$;
revoke all on function private.rounds_guard() from public, anon, authenticated;

create or replace trigger rounds_guard
  before insert on public.rounds
  for each row execute function private.rounds_guard();

-- ── Scores ─────────────────────────────────────────────────
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null
    check (char_length(name) between 2 and 14 and name ~ '^[A-Za-z0-9 ._-]+$'),
  score integer not null
    check (score between 1 and 4000),
  homeroom text
    check (homeroom is null or (char_length(homeroom) between 1 and 12 and homeroom ~ '^[A-Za-z0-9 -]+$')),
  claim_code text not null
    check (claim_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  round_id uuid,
  hits integer check (hits is null or hits between 0 and 400),
  trap text check (trap is null or char_length(trap) <= 200),
  flagged boolean not null default false,
  flag_reason text
);

create index if not exists scores_top_idx on public.scores (score desc, created_at asc);

alter table public.scores enable row level security;

revoke all on public.scores from anon, authenticated;
grant select (name, score, created_at) on public.scores to anon, authenticated;
grant insert (name, score, homeroom, claim_code, round_id, hits, trap) on public.scores to anon, authenticated;

drop policy if exists "Anyone can read scores" on public.scores;
create policy "Anyone can read scores"
  on public.scores for select
  to anon, authenticated
  using (not flagged);

drop policy if exists "Anyone can add a score" on public.scores;
create policy "Anyone can add a score"
  on public.scores for insert
  to anon, authenticated
  with check (true);

create or replace function private.scores_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  squashed text := regexp_replace(lower(new.name || coalesce(new.homeroom, '')), '[^a-z]', '', 'g');
  recent integer;
  from_phone integer;
  r public.rounds%rowtype;
  reasons text[] := array[]::text[];
begin
  new.name := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.homeroom := nullif(btrim(coalesce(new.homeroom, '')), '');
  new.created_at := now();
  new.flagged := false;
  new.flag_reason := null;

  -- Turned down out loud: the player sees these messages.
  -- Keep this word list in step with the one in src/lib/leaderboard.ts.
  if squashed ~ '(fuck|shit|bitch|cunt|dick|cock|pussy|penis|vagina|whore|slut|asshole|nigg|fag|rape|nazi|porn|sex|kys)' then
    raise exception 'That name is not allowed';
  end if;

  select count(*) into recent from public.scores where created_at > now() - interval '1 minute';
  if recent >= 30 then
    raise exception 'Too many scores at once. Try again in a minute.';
  end if;

  -- The score has to belong to a real round that lasted about a minute, and each round counts once.
  if new.round_id is null then
    raise exception 'That round could not be checked. Play again.';
  end if;
  select * into r from public.rounds where id = new.round_id for update;
  if not found or r.used
     or now() - r.started_at < interval '55 seconds'
     or now() - r.started_at > interval '15 minutes' then
    raise exception 'That round could not be checked. Play again.';
  end if;
  update public.rounds set used = true where id = r.id;

  -- Quiet tripwires: the post "works", but the row is hidden and the reason is recorded.
  if coalesce(new.trap, '') <> '' then
    reasons := array_append(reasons, 'filled in the hidden field (a bot)');
  end if;
  if new.score > 1500 then
    reasons := array_append(reasons, 'score higher than a person can reach');
  end if;
  -- A cup is worth at most 75 points, and a pyramid bonus is 50.
  if new.hits is null or new.score > new.hits * 75 + (new.hits / 6 + 1) * 50 then
    reasons := array_append(reasons, 'score does not match the cups landed');
  end if;
  select count(*) into from_phone
  from public.scores
  where claim_code = new.claim_code and created_at > now() - interval '10 minutes';
  if from_phone >= 5 then
    reasons := array_append(reasons, 'too many posts from one phone');
  end if;

  if array_length(reasons, 1) > 0 then
    new.flagged := true;
    new.flag_reason := array_to_string(reasons, '; ');
  end if;

  return new;
end;
$$;
revoke all on function private.scores_guard() from public, anon, authenticated;

create or replace trigger scores_guard
  before insert on public.scores
  for each row execute function private.scores_guard();
