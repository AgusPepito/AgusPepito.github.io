-- Paste this whole file into the Supabase SQL Editor and click Run.
-- Safe to run again. This does not delete existing times.
begin;

create schema if not exists race_private;
revoke all on schema race_private from public, anon, authenticated;

create table if not exists race_private.courses (
  level_id text not null,
  revision text not null,
  primary key (level_id, revision)
);
insert into race_private.courses (level_id, revision) values
  ('dockyards-clear-route', 'r3'), ('dockyards-first-shift', 'r3'),
  ('dockyards-third-signal', 'r3'), ('dockyards-departure', 'r3'),
  ('conduits-thread', 'r3'), ('conduits-spiral', 'r3'),
  ('conduits-switchback', 'r3'), ('conduits-flow', 'r3'),
  ('broken-span-hurdles', 'r3'), ('broken-span-crossing', 'r3'),
  ('broken-span-long-reach', 'r3'), ('broken-span-landing-line', 'r3'),
  ('relay-grid-pulse', 'r3'), ('relay-grid-switch-thread', 'r3'),
  ('relay-grid-rotating-signal', 'r3'), ('relay-grid-circuit', 'r3'),
  ('outer-ring-orbit', 'r3'), ('outer-ring-helix', 'r3'),
  ('outer-ring-fast-line', 'r3'), ('outer-ring-run', 'r3'),
  ('nexus-thread-land', 'r3'), ('nexus-signal-flight', 'r3'),
  ('nexus-surface-shift', 'r3'), ('nexus-grand-circuit', 'r3')
on conflict do nothing;

create table if not exists race_private.pilots (
  player_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 20
    and display_name !~ '[[:cntrl:]]'),
  last_submission timestamptz not null default now()
);
create table if not exists race_private.best_times (
  player_id uuid not null references race_private.pilots(player_id) on delete cascade,
  level_id text not null,
  revision text not null,
  time_ms integer not null check (time_ms between 1000 and 3600000),
  achieved_at timestamptz not null default now(),
  primary key (player_id, level_id, revision),
  foreign key (level_id, revision) references race_private.courses(level_id, revision)
);
create index if not exists best_times_ranking_idx on race_private.best_times
  (level_id, revision, time_ms, achieved_at, player_id);

alter table race_private.courses enable row level security;
alter table race_private.pilots enable row level security;
alter table race_private.best_times enable row level security;
revoke all on all tables in schema race_private from public, anon, authenticated;

-- Only these two functions expose leaderboard data. Direct table access is denied.
-- Owner privileges are intentional; every name is schema-qualified and the
-- submitting player is derived from the signed JWT, never from a client parameter.
create or replace function public.submit_race_time(
  p_level_id text, p_revision text, p_time_ms integer, p_display_name text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_player uuid := auth.uid();
  v_name text := btrim(p_display_name);
begin
  if v_player is null then
    raise exception 'Sign in before submitting a time.' using errcode = '42501';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 20 or v_name ~ '[[:cntrl:]]' then
    raise exception 'Nickname must contain 2 to 20 printable characters.' using errcode = '22023';
  end if;
  if p_time_ms is null or p_time_ms not between 1000 and 3600000 then
    raise exception 'Invalid completion time.' using errcode = '22023';
  end if;
  if not exists (select 1 from race_private.courses where level_id = p_level_id and revision = p_revision) then
    raise exception 'Unknown course or revision.' using errcode = '22023';
  end if;

  -- This row lock serializes submissions by a player. The primary key/upsert
  -- below ensures simultaneous or delayed requests cannot overwrite a better time.
  insert into race_private.pilots (player_id, display_name, last_submission)
    values (v_player, v_name, now())
  on conflict (player_id) do update
    set display_name = excluded.display_name, last_submission = excluded.last_submission;

  insert into race_private.best_times (player_id, level_id, revision, time_ms)
    values (v_player, p_level_id, p_revision, p_time_ms)
  on conflict (player_id, level_id, revision) do update
    set time_ms = excluded.time_ms, achieved_at = excluded.achieved_at
    where excluded.time_ms < race_private.best_times.time_ms;
end;
$$;

create or replace function public.get_race_leaderboard(p_level_id text, p_revision text)
returns table ("position" bigint, display_name text, time_ms integer, is_you boolean)
language sql stable security definer set search_path = ''
as $$
  select row_number() over (order by b.time_ms, b.achieved_at, b.player_id),
    p.display_name, b.time_ms, coalesce(b.player_id = auth.uid(), false)
  from race_private.best_times b
  join race_private.pilots p on p.player_id = b.player_id
  where b.level_id = p_level_id and b.revision = p_revision
  order by b.time_ms, b.achieved_at, b.player_id
  limit 10;
$$;

revoke all on function public.submit_race_time(text, text, integer, text) from public, anon, authenticated;
revoke all on function public.get_race_leaderboard(text, text) from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function public.submit_race_time(text, text, integer, text) to authenticated;
grant execute on function public.get_race_leaderboard(text, text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
