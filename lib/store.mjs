import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  DAILY_FREE_TOKEN_LIMIT,
  freePoolLimit,
  isFreeForPlan,
  poolWeight,
  DEFAULT_MODELS,
  PLANS,
  PLATFORM_PRESETS,
  calculateCostUsd
} from './pricing.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.ABLI_DATA_DIR || path.join(ROOT_DIR, '.abli-data');
const STATE_PATH = path.join(DATA_DIR, 'state.json');

export function loadEnvFile() {
  return { ...process.env };
}

function defaultProvidersFromEnv() {
  const env = process.env;
  const keyFor = (id) => (id === 'custom' ? env.CUSTOM_OPENAI_API_KEY : env[id.toUpperCase() + '_API_KEY']) || '';
  const keyMap = Object.fromEntries(PLATFORM_PRESETS.map((p) => [p.id, keyFor(p.id)]));
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
      brevoApiKey: process.env.BREVO_API_KEY || '',
      brevoTemplateId: process.env.BREVO_TEMPLATE_ID || '',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
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
    map.set(def.slug, prev ? { ...prev, ...def } : def);
  }
  const keep = new Set(DEFAULT_MODELS.map((m) => m.slug));
  return Array.from(map.values()).filter((m) => keep.has(m.slug));
}

function mergeSettings(base, saved = {}) {
  const out = { ...base, ...saved };
  for (const [k, v] of Object.entries(base)) if (v) out[k] = v;
  return out;
}

function syncProviders(saved = [], base = []) {
  const prev = new Map(saved.map((p) => [p.id, p]));
  return base.map((b) => {
    const old = prev.get(b.id);
    const apiKey = b.apiKey || old?.apiKey || '';
    const baseUrl = b.id === 'custom' ? b.baseUrl || old?.baseUrl || '' : b.baseUrl;
    return { ...b, baseUrl, apiKey, enabled: Boolean(apiKey) };
  });
}

const ENC_PREFIX = 'enc:v1:';
const SECRET_SETTINGS = ['supabaseServiceRoleKey', 'brevoApiKey', 'resendApiKey', 'stripeSecretKey', 'stripeWebhookSecret'];
let dataKeyCache = null;

// Key that protects saved API keys. Set ABLI_ENCRYPTION_KEY on your server so it never sits next to the data.
async function loadDataKey() {
  if (dataKeyCache) return dataKeyCache;
  const fromEnv = (process.env.ABLI_ENCRYPTION_KEY || '').trim();
  if (fromEnv) {
    dataKeyCache = crypto.createHash('sha256').update(fromEnv).digest();
    return dataKeyCache;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const keyPath = path.join(DATA_DIR, 'secret.key');
  try {
    dataKeyCache = Buffer.from((await fs.readFile(keyPath, 'utf8')).trim(), 'hex');
  } catch {
    dataKeyCache = crypto.randomBytes(32);
    await fs.writeFile(keyPath, dataKeyCache.toString('hex'), { encoding: 'utf8', mode: 0o600 });
  }
  return dataKeyCache;
}

export function encryptSecret(plain, key) {
  if (!plain || String(plain).startsWith(ENC_PREFIX)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ENC_PREFIX + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

export function decryptSecret(value, key) {
  if (!value || !String(value).startsWith(ENC_PREFIX)) return value;
  try {
    const raw = Buffer.from(String(value).slice(ENC_PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

function mapSecrets(state, fn) {
  const out = JSON.parse(JSON.stringify(state));
  for (const p of out.providers || []) if (p.apiKey) p.apiKey = fn(p.apiKey);
  for (const k of SECRET_SETTINGS) if (out.settings?.[k]) out.settings[k] = fn(out.settings[k]);
  return out;
}

let stateCache = null;

export async function getState() {
  if (stateCache) return stateCache;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const dataKey = await loadDataKey();
    const parsed = mapSecrets(JSON.parse(raw), (v) => decryptSecret(v, dataKey));
    const base = createInitialState();
    stateCache = {
      ...base,
      ...parsed,
      settings: mergeSettings(base.settings, parsed.settings),
      providers: syncProviders(parsed.providers, base.providers),
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
  const dataKey = await loadDataKey();
  await fs.writeFile(STATE_PATH, JSON.stringify(mapSecrets(stateCache, (v) => encryptSecret(v, dataKey)), null, 2), 'utf8');
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

export function getFreePool(user) {
  const today = todayUtcKey();
  const used = Number(user?.dailyFreePool?.[today] || 0);
  const limit = freePoolLimit(user?.plan);
  return { used, limit, remaining: Math.max(0, limit - used) };
}

// Kept for older callers: free usage is now one shared pool, not per model.
export function getFreeUsageForModel(user) {
  return getFreePool(user);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const today = todayUtcKey();
  const spendCap = Number(user.spendCapUsd || 0);
  const cycleSpend = Number(user.currentCycleSpendUsd || 0);
  const planUsagePercent = spendCap > 0 ? Math.min(100, Math.round((cycleSpend / spendCap) * 1000) / 10) : 0;
  const pool = getFreePool(user);
  const freeUsageByModel = {};
  for (const m of DEFAULT_MODELS) {
    if (isFreeForPlan(m, user.plan)) freeUsageByModel[m.slug] = pool;
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
    freeUsedToday: pool.used,
    freeLimitDaily: pool.limit,
    freeRemainingToday: pool.remaining,
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
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
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
  if (session.expiresAt - Date.now() < 1000 * 60 * 60 * 24 * 20) {
    session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
    void saveState();
  }
  return st.users.find((u) => u.id === session.userId) || null;
}

export function checkQuota(user, model) {
  if (!user) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'Sign in to start coding with Abli Code.' };
  }
  if (!model) {
    return { allowed: false, code: 'MODEL_NOT_FOUND', message: 'Selected model not found.' };
  }

  if (isFreeForPlan(model, user.plan)) {
    const pool = getFreePool(user);
    if (pool.remaining > 0) return { allowed: true };
    if (model.tier === 'free') {
      return {
        allowed: false,
        code: 'FREE_DAILY_LIMIT_REACHED',
        message: 'You have used all ' + pool.limit.toLocaleString() + ' free tokens for today. They reset at 00:00 UTC. Add credits or a paid plan to keep going.'
      };
    }
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

  const poolBefore = getFreePool(user);
  const useFree = isFreeForPlan(model, user.plan) && poolBefore.remaining > 0;
  if (useFree) {
    user.dailyFreePool = user.dailyFreePool || {};
    const units = Math.ceil(totalTokens * poolWeight(model));
    user.dailyFreePool[today] = Math.min(poolBefore.limit, poolBefore.used + units);
    for (const k of Object.keys(user.dailyFreePool)) if (k !== today) delete user.dailyFreePool[k];
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

