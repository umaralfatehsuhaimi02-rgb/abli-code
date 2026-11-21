-- Abli Code Supabase Schema (MIT Open Source)
-- Covers Auth profiles, Plus/Pro/Max 150% spend caps, credit top-ups,
-- 1.5M tokens/day free DeepSeek hard limit, custom 6-digit email verification,
-- operator provider configs, and chat/REA history.

create extension if not exists pgcrypto;

-- 1. User Profiles & Quota Ledger
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  email_verified boolean not null default false,
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro', 'max')),
  subscription_price_usd numeric(10, 2) not null default 0.00,
  spend_cap_usd numeric(10, 4) not null default 0.00, -- 150% of subscription_price_usd
  current_cycle_spend_usd numeric(10, 6) not null default 0.00,
  credit_balance_usd numeric(10, 6) not null default 0.00,
  cycle_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-compute 150% spend cap whenever subscription_price_usd changes
create or replace function public.sync_150_percent_cap()
returns trigger language plpgsql as $$
begin
  new.spend_cap_usd := round((coalesce(new.subscription_price_usd, 0) * 1.50)::numeric, 4);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_cap on public.profiles;
create trigger trg_profiles_cap
  before insert or update of subscription_price_usd on public.profiles
  for each row execute function public.sync_150_percent_cap();

-- 2. Daily Free Model Usage (DeepSeek Abliterated = 1,500,000 tokens/day hard stop)
create table if not exists public.daily_free_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  model_slug text not null,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  total_tokens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date, model_slug)
);

-- 3. Custom 6-Digit Email Verification Codes
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

-- 4. Operator Provider & Platform Configuration (Enter API key + platform to go live)
create table if not exists public.provider_configs (
  slug text primary key,
  display_name text not null,
  platform text not null, -- openrouter | chutes | deepinfra | together | fireworks | huggingface | ollama | custom
  base_url text not null,
  api_key text,
  auth_header text not null default 'Authorization',
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 5. Model Catalog (Free + Premium Abliterated Models)
create table if not exists public.model_catalog (
  slug text primary key,
  display_name text not null,
  family text not null,
  provider_slug text references public.provider_configs(slug) on delete set null,
  upstream_model_id text not null,
  tier text not null check (tier in ('free', 'premium')),
  daily_free_token_limit bigint not null default 0,
  input_cost_per_1m_usd numeric(10, 4) not null default 0,
  output_cost_per_1m_usd numeric(10, 4) not null default 0,
  context_window int not null default 128000,
  description text,
  is_enabled boolean not null default true,
  sort_order int not null default 0
);

insert into public.model_catalog
  (slug, display_name, family, upstream_model_id, tier, daily_free_token_limit, input_cost_per_1m_usd, output_cost_per_1m_usd, context_window, description, sort_order)
values
  ('deepseek-abliterated', 'DeepSeek Abliterated', 'DeepSeek', 'deepseek/deepseek-chat-abliterated', 'free', 1500000, 0.0000, 0.0000, 128000, 'Free tier coding & reverse-engineering model. Hard stops at 1,500,000 tokens/day UTC.', 1),
  ('glm-5.3-flash-abliterated', 'GLM 5.3 Flash Abliterated', 'GLM', 'zai/glm-5.3-flash-abliterated', 'premium', 0, 0.3500, 1.1000, 128000, 'Ultra-low-latency abliterated coding model for agentic loops and rapid patches.', 2),
  ('glm-5.3-abliterated', 'GLM 5.3 Abliterated', 'GLM', 'zai/glm-5.3-abliterated', 'premium', 0, 1.2500, 4.5000, 200000, 'Flagship abliterated reasoning & deep binary/system architecture synthesis.', 3),
  ('qwen-abliterated', 'Qwen Abliterated', 'Qwen', 'qwen/qwen-coder-abliterated', 'premium', 0, 0.6000, 2.0000, 131072, 'High-precision code generation, decompilation cleanup, and multi-file refactors.', 4),
  ('kimi-abliterated', 'Kimi Abliterated', 'Kimi', 'moonshot/kimi-abliterated', 'premium', 0, 1.0000, 3.5000, 256000, 'Long-context abliterated analyst built for whole-repo and binary trace reconstruction.', 5)
on conflict (slug) do nothing;

-- 6. Usage & Billing Ledgers
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  model_slug text not null,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  total_tokens bigint not null default 0,
  billed_usd numeric(10, 6) not null default 0,
  billing_source text not null check (billing_source in ('free_daily', 'subscription_cap', 'topup_credits')),
  created_at timestamptz not null default now()
);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('subscription', 'topup')),
  item_name text not null,
  amount_usd numeric(10, 2) not null,
  spend_cap_granted_usd numeric(10, 2) not null default 0,
  credits_granted_usd numeric(10, 2) not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

-- 7. Chat & Reverse Engineering Sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Session',
  model_slug text not null default 'deepseek-abliterated',
  mode text not null default 'code' check (mode in ('code', 'rea', 'computer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.daily_free_usage enable row level security;
alter table public.email_verification_codes enable row level security;
alter table public.provider_configs enable row level security;
alter table public.model_catalog enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile basic" on public.profiles
  for update using (auth.uid() = id);

create policy "Users view own daily usage" on public.daily_free_usage
  for select using (auth.uid() = user_id);

create policy "Anyone can read enabled models" on public.model_catalog
  for select using (is_enabled = true);

create policy "Users view own usage ledger" on public.usage_ledger
  for select using (auth.uid() = user_id);

create policy "Users view own billing" on public.billing_transactions
  for select using (auth.uid() = user_id);

create policy "Users manage own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own messages" on public.chat_messages
  for all using (auth.uid() = user_id);
