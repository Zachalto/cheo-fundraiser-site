-- Leaderboard for the cup stacking game.
-- This has already been run on the "cheo-leaderboard" Supabase project.
-- To set up a fresh project: dashboard > SQL Editor > New query > paste > Run.
--
-- What it sets up:
--   * a "scores" table: name, score, time, plus two private columns
--   * the public can read name, score and time, and can add a score
--   * the public can NOT read homeroom or claim_code, and can't change or delete anything
--   * limits: name length and characters, a score ceiling, a bad-word check, and a flood limit
--
-- Private columns (only visible in the Supabase dashboard):
--   homeroom    optional, typed by the player, so organisers can find finalists
--   claim_code  made by the player's phone. A finalist proves a score is theirs by showing
--               the same code on their phone.
--
-- To remove an entry: dashboard > Table Editor > scores > select the row > Delete.

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null
    check (char_length(name) between 2 and 14 and name ~ '^[A-Za-z0-9 ._-]+$'),
  -- 4000 is more than a perfect round can reach.
  score integer not null
    check (score between 1 and 4000),
  homeroom text
    check (homeroom is null or (char_length(homeroom) between 1 and 12 and homeroom ~ '^[A-Za-z0-9 -]+$')),
  claim_code text not null
    check (claim_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);

create index if not exists scores_top_idx on public.scores (score desc, created_at asc);

alter table public.scores enable row level security;

-- Column-level access: the private columns are never readable from the website.
revoke all on public.scores from anon, authenticated;
grant select (name, score, created_at) on public.scores to anon, authenticated;
grant insert (name, score, homeroom, claim_code) on public.scores to anon, authenticated;

drop policy if exists "Anyone can read scores" on public.scores;
create policy "Anyone can read scores"
  on public.scores for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can add a score" on public.scores;
create policy "Anyone can add a score"
  on public.scores for insert
  to anon, authenticated
  with check (true);

-- Extra checks that run before a score is saved.
create or replace function public.scores_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  squashed text := regexp_replace(lower(new.name || coalesce(new.homeroom, '')), '[^a-z]', '', 'g');
  recent integer;
begin
  new.name := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.homeroom := nullif(btrim(coalesce(new.homeroom, '')), '');
  new.created_at := now();

  -- Keep this list in step with the one in src/lib/leaderboard.ts.
  if squashed ~ '(fuck|shit|bitch|cunt|dick|cock|pussy|penis|vagina|whore|slut|asshole|nigg|fag|rape|nazi|porn|sex|kys)' then
    raise exception 'That name is not allowed';
  end if;

  -- Flood limit: at most 30 new scores per minute across the whole site.
  select count(*) into recent
  from public.scores
  where created_at > now() - interval '1 minute';
  if recent >= 30 then
    raise exception 'Too many scores at once. Try again in a minute.';
  end if;

  return new;
end;
$$;

-- The function only makes sense as a trigger; nobody should call it directly.
revoke all on function public.scores_guard() from public, anon, authenticated;

drop trigger if exists scores_guard on public.scores;
create trigger scores_guard
  before insert on public.scores
  for each row execute function public.scores_guard();
