import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  DAILY_FREE_TOKEN_LIMIT,
  DEFAULT_MODELS,
  PLANS,
  PLATFORM_PRESETS,
  calculateCostUsd
} from './pricing.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, '.abli-data');
const STATE_PATH = path.join(DATA_DIR, 'state.json');

export function loadEnvFile() {
  return { ...process.env };
}

function defaultProvidersFromEnv() {
  const env = process.env;
  const keyMap = {
    openrouter: env.OPENROUTER_API_KEY || '',
    chutes: env.CHUTES_API_KEY || '',
    deepinfra: env.DEEPINFRA_API_KEY || '',
    together: env.TOGETHER_API_KEY || '',
    fireworks: env.FIREWORKS_API_KEY || '',
    huggingface: env.HUGGINGFACE_API_KEY || '',
    ollama: '',
    custom: env.CUSTOM_OPENAI_API_KEY || ''
  };
  return PLATFORM_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.id === 'custom' && env.CUSTOM_OPENAI_BASE_URL ? env.CUSTOM_OPENAI_BASE_URL : p.baseUrl,
    apiKey: keyMap[p.id] || '',
    enabled: Boolean(keyMap[p.id])
  }));
}

function createInitialState() {
  return {
    settings: {
      appUrl: process.env.APP_URL || 'http://localhost:4747',
      contactEmail: process.env.CONTACT_EMAIL || 'umaralfatehsuhaimi02@gmail.com',
      adminEmail: process.env.ADMIN_EMAIL || 'umaralfatehsuhaimi02@gmail.com',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      resendApiKey: process.env.RESEND_API_KEY || '',
      emailFrom: process.env.EMAIL_FROM || 'Abli Code <onboarding@resend.dev>',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    },
    providers: defaultProvidersFromEnv(),
    models: DEFAULT_MODELS,
    users: [],
    verificationCodes: [],
    sessions: [],
    usageLedger: [],
    transactions: [],
    chatSessions: [],
    processedStripeSessions: []
  };
}

function syncDefaultModels(existing = []) {
  const map = new Map(existing.map((m) => [m.slug, m]));
  for (const def of DEFAULT_MODELS) {
    const prev = map.get(def.slug);
    map.set(def.slug, prev ? { ...def, ...prev, tier: def.tier, dailyFreeTokenLimit: def.dailyFreeTokenLimit, speedBadge: def.speedBadge, description: def.description } : def);
  }
  const keep = new Set(DEFAULT_MODELS.map((m) => m.slug));
  return Array.from(map.values()).filter((m) => keep.has(m.slug));
}

let stateCache = null;

export async function getState() {
  if (stateCache) return stateCache;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const base = createInitialState();
    stateCache = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      providers: parsed.providers?.length ? parsed.providers : base.providers,
      models: syncDefaultModels(parsed.models || [])
    };
  } catch {
    stateCache = createInitialState();
    await saveState();
  }
  return stateCache;
}

export async function saveState() {
  if (!stateCache) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(stateCache, null, 2), 'utf8');
}

export async function getSupabaseClients() {
  const st = await getState();
  const url = st.settings.supabaseUrl;
  const pubKey = st.settings.supabasePublishableKey;
  const srvKey = st.settings.supabaseServiceRoleKey;
  return {
    publicClient: url && pubKey ? createClient(url, pubKey) : null,
    adminClient: url && srvKey ? createClient(url, srvKey) : null,
    url,
    pubKey
  };
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function todayUtcKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getFreeUsageForModel(user, modelSlug, dailyLimit = DAILY_FREE_TOKEN_LIMIT) {
  const today = todayUtcKey();
  const perModel = Number(user?.dailyFreeTokensByModel?.[today]?.[modelSlug] || 0);
  const legacy = modelSlug === 'deepseek-abliterated' ? Number(user?.dailyFreeTokens?.[today] || 0) : 0;
  const used = Math.max(perModel, legacy);
  return {
    used,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - used)
  };
}

export function sanitizeUser(user) {
  if (!user) return null;
  const today = todayUtcKey();
  const spendCap = Number(user.spendCapUsd || 0);
  const cycleSpend = Number(user.currentCycleSpendUsd || 0);
  const planUsagePercent = spendCap > 0 ? Math.min(100, Math.round((cycleSpend / spendCap) * 1000) / 10) : 0;
  const freeModels = DEFAULT_MODELS.filter((m) => m.tier === 'free');
  const freeUsageByModel = {};
  let totalFreeUsedToday = 0;
  for (const m of freeModels) {
    const u = getFreeUsageForModel(user, m.slug, m.dailyFreeTokenLimit || DAILY_FREE_TOKEN_LIMIT);
    freeUsageByModel[m.slug] = u;
    totalFreeUsedToday += u.used;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    plan: user.plan,
    subscriptionPriceUsd: Number(user.subscriptionPriceUsd || 0),
    planUsagePercent,
    planLimitReached: spendCap > 0 && cycleSpend >= spendCap,
    creditBalanceUsd: Number(Number(user.creditBalanceUsd || 0).toFixed(4)),
    freeUsageByModel,
    freeUsedToday: totalFreeUsedToday,
    freeLimitDaily: DAILY_FREE_TOKEN_LIMIT,
    freeRemainingToday: freeUsageByModel['deepseek-abliterated']?.remaining ?? DAILY_FREE_TOKEN_LIMIT,
    todayUtc: today,
    createdAt: user.createdAt
  };
}

export async function ensureAdminUser(email, name = 'Umar Al-Fateh Suhaimi') {
  const st = await getState();
  const clean = email.trim().toLowerCase();
  let user = st.users.find((u) => u.email === clean);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email: clean,
      name,
      passwordHash: null,
      role: clean === st.settings.adminEmail.toLowerCase() ? 'admin' : 'user',
      emailVerified: true,
      authProvider: 'email',
      plan: 'max',
      subscriptionPriceUsd: 100,
      spendCapUsd: 150,
      currentCycleSpendUsd: 0,
      creditBalanceUsd: 25,
      dailyFreeTokens: {},
      dailyFreeTokensByModel: {},
      createdAt: new Date().toISOString()
    };
    st.users.push(user);
    await saveState();
  }
  return user;
}

export async function createSession(userId) {
  const st = await getState();
  const token = crypto.randomBytes(32).toString('hex');
  st.sessions.push({
    token,
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14
  });
  if (st.sessions.length > 500) st.sessions = st.sessions.slice(-300);
  await saveState();
  return token;
}

export async function getUserByToken(token) {
  if (!token) return null;
  const st = await getState();
  const session = st.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;
  return st.users.find((u) => u.id === session.userId) || null;
}

export function checkQuota(user, model) {
  if (!user) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'Sign in to start coding with Abli Code.' };
  }
  if (!model) {
    return { allowed: false, code: 'MODEL_NOT_FOUND', message: 'Selected model not found.' };
  }

  if (model.tier === 'free') {
    const limit = Number(model.dailyFreeTokenLimit || DAILY_FREE_TOKEN_LIMIT);
    const { used } = getFreeUsageForModel(user, model.slug, limit);
    if (used >= limit) {
      return {
        allowed: false,
        code: 'FREE_DAILY_LIMIT_REACHED',
        message: `Daily free limit reached for ${model.name} (${used.toLocaleString()} / ${limit.toLocaleString()} tokens). Switch to another free model, wait until 00:00 UTC, or top up credits.`
      };
    }
    return { allowed: true };
  }

  // Paid / cheap / flagship model: requires active paid plan OR positive top-up credits
  // Internal 150% spend cap is enforced silently without disclosing the multiplier
  const remainingCap = Math.max(0, Number(user.spendCapUsd || 0) - Number(user.currentCycleSpendUsd || 0));
  const credits = Math.max(0, Number(user.creditBalanceUsd || 0));

  if (user.plan === 'free' && credits <= 0) {
    return {
      allowed: false,
      code: 'UPGRADE_REQUIRED',
      message: `${model.name} requires a Plus, Pro, or Max plan, or available credit top-ups.`
    };
  }

  if (remainingCap <= 0 && credits <= 0) {
    return {
      allowed: false,
      code: 'PLAN_LIMIT_REACHED',
      message: `You have reached your monthly usage limit on the ${user.plan.toUpperCase()} plan. Top up credits or upgrade your plan to keep going.`
    };
  }

  return { allowed: true };
}

export async function recordUsage(userId, model, promptTokens, completionTokens) {
  const st = await getState();
  const user = st.users.find((u) => u.id === userId);
  if (!user) return null;

  const totalTokens = promptTokens + completionTokens;
  const today = todayUtcKey();
  let billedUsd = 0;
  let billingSource = 'free_daily';

  if (model.tier === 'free') {
    const limit = Number(model.dailyFreeTokenLimit || DAILY_FREE_TOKEN_LIMIT);
    user.dailyFreeTokensByModel = user.dailyFreeTokensByModel || {};
    user.dailyFreeTokensByModel[today] = user.dailyFreeTokensByModel[today] || {};
    const prev = getFreeUsageForModel(user, model.slug, limit).used;
    user.dailyFreeTokensByModel[today][model.slug] = Math.min(limit, prev + totalTokens);
  } else {
    billedUsd = calculateCostUsd(model, promptTokens, completionTokens);
    const remainingCap = Math.max(0, Number(user.spendCapUsd || 0) - Number(user.currentCycleSpendUsd || 0));
    if (remainingCap >= billedUsd) {
      user.currentCycleSpendUsd = Number((Number(user.currentCycleSpendUsd || 0) + billedUsd).toFixed(6));
      billingSource = 'subscription';
    } else {
      const overflow = billedUsd - remainingCap;
      user.currentCycleSpendUsd = Number(user.spendCapUsd || 0);
      user.creditBalanceUsd = Number(Math.max(0, Number(user.creditBalanceUsd || 0) - overflow).toFixed(6));
      billingSource = 'topup_credits';
    }
  }

  st.usageLedger.unshift({
    id: crypto.randomUUID(),
    userId,
    modelSlug: model.slug,
    promptTokens,
    completionTokens,
    totalTokens,
    billedUsd,
    billingSource,
    createdAt: new Date().toISOString()
  });
  if (st.usageLedger.length > 500) st.usageLedger = st.usageLedger.slice(0, 500);

  await saveState();
  return sanitizeUser(user);
}

export async function applySubscription(userId, planId) {
  const st = await getState();
  const plan = PLANS[planId];
  if (!plan) throw new Error('Invalid plan');
  const user = st.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.plan = plan.id;
  user.subscriptionPriceUsd = plan.priceUsd;
  // Undisclosed 150% internal spend ceiling
  user.spendCapUsd = Number((plan.priceUsd * 1.5).toFixed(2));
  user.currentCycleSpendUsd = 0;

  st.transactions.unshift({
    id: crypto.randomUUID(),
    userId,
    kind: 'subscription',
    itemName: `${plan.name} Plan`,
    amountUsd: plan.priceUsd,
    spendCapGrantedUsd: user.spendCapUsd,
    creditsGrantedUsd: 0,
    createdAt: new Date().toISOString()
  });

  await saveState();
  return sanitizeUser(user);
}

export async function applyTopUp(userId, amountUsd) {
  const st = await getState();
  const amt = Number(amountUsd);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error('Invalid top-up amount');
  const user = st.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.creditBalanceUsd = Number((Number(user.creditBalanceUsd || 0) + amt).toFixed(6));
  st.transactions.unshift({
    id: crypto.randomUUID(),
    userId,
    kind: 'topup',
    itemName: `Credit Top-Up +$${amt.toFixed(2)}`,
    amountUsd: amt,
    spendCapGrantedUsd: 0,
    creditsGrantedUsd: amt,
    createdAt: new Date().toISOString()
  });

  await saveState();
  return sanitizeUser(user);
}

