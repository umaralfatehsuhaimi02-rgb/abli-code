create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro', 'max')),
  usage_cap_usd numeric(10, 4) not null default 0,
  cycle_spend_usd numeric(10, 6) not null default 0,
  credit_balance_usd numeric(10, 6) not null default 0,
  cycle_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@no-email.local'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_abli on auth.users;
create trigger on_auth_user_created_abli
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  purpose text not null default 'signup' check (purpose in ('signup', 'login', 'reset')),
  attempts int not null default 0,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_codes_lookup on public.email_verification_codes (email, created_at desc);

create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  model_slug text not null,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  billed_usd numeric(10, 6) not null default 0,
  source text not null check (source in ('subscription', 'credits')),
  created_at timestamptz not null default now()
);
create index if not exists idx_usage_ledger_user on public.usage_ledger (user_id, created_at desc);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('subscription', 'topup')),
  item_name text not null,
  amount_usd numeric(10, 2) not null,
  credits_usd numeric(10, 2) not null default 0,
  fee_usd numeric(10, 2) not null default 0,
  stripe_session_id text unique,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index if not exists idx_billing_user on public.billing_transactions (user_id, created_at desc);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New thread',
  model_slug text not null default 'glm-5.3-flash-abliterated',
  project_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chat_sessions_user on public.chat_sessions (user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  tokens_used bigint not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);
create index if not exists idx_chat_messages_user on public.chat_messages (user_id);

alter table public.profiles enable row level security;
alter table public.email_verification_codes enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "Users read own usage" on public.usage_ledger
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own billing" on public.billing_transactions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users manage own threads" on public.chat_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own messages" on public.chat_messages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
  );
