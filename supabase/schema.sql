-- The Fourth Notebook: database for "Sign in to sync".
-- Paste this whole file into Supabase → SQL Editor → New query, and click Run.
-- Safe to run more than once.
--
-- Each signed-in person gets their own rows. Row-level security means the app
-- can only ever read or write rows whose user_id is the signed-in person's id,
-- so nobody can see anyone else's words, even though the app key is public.

-- ---------- Words ----------
create table if not exists public.words (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  data       jsonb,                          -- the word itself (null once deleted)
  deleted    boolean     not null default false, -- kept so other devices learn about deletes
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists words_user_updated on public.words (user_id, updated_at);

-- ---------- Quiz results ----------
create table if not exists public.quizzes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists quizzes_user_updated on public.quizzes (user_id, updated_at);

-- The server stamps every change, so devices can ask "what changed since…?"
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists words_touch on public.words;
create trigger words_touch before insert or update on public.words
  for each row execute function public.touch_updated_at();

drop trigger if exists quizzes_touch on public.quizzes;
create trigger quizzes_touch before insert or update on public.quizzes
  for each row execute function public.touch_updated_at();

-- ---------- Only you can see your rows ----------
alter table public.words enable row level security;
alter table public.quizzes enable row level security;

drop policy if exists "Own words" on public.words;
create policy "Own words" on public.words
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Own quizzes" on public.quizzes;
create policy "Own quizzes" on public.quizzes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.words, public.quizzes from anon;
grant select, insert, update, delete on public.words, public.quizzes to authenticated;

-- ---------- Delete my account ----------
-- Removes the sign-in and, through "on delete cascade", every word and quiz.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
