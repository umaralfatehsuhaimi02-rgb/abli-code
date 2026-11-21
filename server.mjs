import { searchWeb } from './lib/websearch.mjs';
const searchHits = new Map();
function allowSearch(id) {
  const now = Date.now();
  const arr = (searchHits.get(id) || []).filter((t) => now - t < 60000);
  if (arr.length >= 20) { searchHits.set(id, arr); return false; }
  arr.push(now); searchHits.set(id, arr); return true;
}
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = __dirname;

// Pending browser sign-ins started from the desktop app (loginId -> state).
const desktopLogins = new Map();
function pruneDesktopLogins() {
  const now = Date.now();
  for (const [id, v] of desktopLogins) if (now - v.createdAt > 10 * 60 * 1000) desktopLogins.delete(id);
}

async function loadDotEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT_DIR, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    // ignore missing .env
  }
}
await loadDotEnv();

import {
  applySubscription,
  applyTopUp,
  checkQuota,
  getState,
  getUserByToken,
  recordUsage,
  sanitizeUser,
  saveState
} from './lib/store.mjs';
import {
  exchangeSupabaseAccessToken,
  getOAuthAuthorizeUrl,
  loginWithPassword,
  registerWithEmail,
  sendVerificationCode
} from './lib/auth.mjs';
import { DAILY_FREE_TOKEN_LIMIT, PLANS, PLATFORM_PRESETS, TOPUP_PACKS, sellPrices, topUpQuote } from './lib/pricing.mjs';
import {
  createStripeCheckoutSession,
  createStripePortalSession,
  cancelStripeSubscriptions,
  switchStripeSubscription,
  verifyStripeCheckoutSession,
  verifyStripeWebhookEvent,
  getActiveSubscription
} from './lib/stripe.mjs';

// Keeps a paid plan honest: if the Stripe subscription is gone (cancelled, payment failed) the user drops to Free,
// and a new billing period resets the usage meter. Checked at most every 10 minutes per user.
async function syncBilling(user) {
  try {
    if (!user || user.role === 'admin' || user.plan === 'free') return;
    const state = await getState();
    const key = state.settings.stripeSecretKey;
    if (!key) return;
    if (Date.now() - Number(user.lastBillingSyncAt || 0) < 10 * 60 * 1000) return;
    user.lastBillingSyncAt = Date.now();
    const sub = await getActiveSubscription(key, user.stripeCustomerId, user.email);
    if (!sub) {
      await applySubscription(user.id, 'free');
      return;
    }
    const periodStart = sub.periodStart * 1000;
    if (periodStart && (!user.cycleStartedAt || periodStart > Number(user.cycleStartedAt) + 60 * 1000)) {
      user.currentCycleSpendUsd = 0;
      user.cycleStartedAt = periodStart;
    }
    await saveState();
  } catch {}
}
import { runChatCompletion } from './lib/providers.mjs';
import {
  deleteCustomMcpServer,
  invokeMcpTool,
  listMcpTools,
  loadMcpServers,
  saveCustomMcpServer
} from './mcp/client.mjs';
import { executeComputerTool } from './lib/computer-control.mjs';
import { REA_TOOLS, executeReaTool } from './mcp/rea-server.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function isLocalReq(req) {
  const a = req.socket && req.socket.remoteAddress || '';
  const local = a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
  return local && !req.headers['x-forwarded-for'] && !req.headers['forwarded'] && !req.headers['cf-connecting-ip'] && !req.headers['x-real-ip'];
}

// Tools (MCP, terminal) run on the machine hosting this server, so they are only
// reachable from the desktop app talking to a local server. The web app never gets them.
function toolsAllowed(req) {
  return isLocalReq(req) && (req.headers['x-abli-desktop'] === '1' || /Electron\//.test(String(req.headers['user-agent'] || '')));
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req, maxBytes = 4 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

// Chat messages may carry photos as inline data URLs. Anything else (remote URLs, odd part types) is dropped.
const chatHits = new Map();
function chatRateOk(id) {
  const now = Date.now();
  const arr = (chatHits.get(id) || []).filter((t) => now - t < 60000);
  if (arr.length >= 20) {
    chatHits.set(id, arr);
    return false;
  }
  arr.push(now);
  chatHits.set(id, arr);
  return true;
}

function sanitizeMessages(list) {
  let images = 0;
  return list
    .map((m) => {
      if (!m || typeof m !== 'object') return null;
      if (!Array.isArray(m.content)) return m;
      const parts = [];
      for (const p of m.content) {
        if (p && p.type === 'text') parts.push({ type: 'text', text: String(p.text ?? '') });
        else if (
          p && p.type === 'image_url' && p.image_url && typeof p.image_url.url === 'string' &&
          p.image_url.url.startsWith('data:image/') && p.image_url.url.length < 8 * 1024 * 1024 && images < 12
        ) {
          images++;
          parts.push({ type: 'image_url', image_url: { url: p.image_url.url } });
        }
      }
      return { ...m, content: parts };
    })
    .filter(Boolean);
}

function getBearer(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

function maskKey(k = '') {
  if (!k) return '';
  if (k.length <= 8) return '********';
  return `${k.slice(0, 4)}****${k.slice(-4)}`;
}

function sanitizePublicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    priceUsd: plan.priceUsd,
    badge: plan.badge,
    tagline: plan.tagline,
    features: plan.features
  };
}

async function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.readFile(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(content);
}

export function createAbliServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        });
        return res.end();
      }

      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost:4747'}`);
      const pathname = urlObj.pathname;

      // SEO, Crawlers & Icons
      if (pathname === '/robots.txt') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'robots.txt'));
      }
      if (pathname === '/sitemap.xml') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'sitemap.xml'));
      }
      if (pathname === '/favicon.svg') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'favicon.svg'));
      }
      if (pathname === '/favicon.ico' || pathname === '/icon.ico') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'icon.ico'));
      }
      if (pathname === '/icon.png') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'icon.png'));
      }

      // Health & Public Catalog
      if (pathname === '/api/health' && req.method === 'GET') {
        const st = await getState();
        return json(res, 200, {
          ok: true,
          app: 'Abli Code',
          version: '1.0.0',
          supabaseConfigured: Boolean(st.settings.supabaseUrl && st.settings.supabasePublishableKey),
          stripeConfigured: Boolean(st.settings.stripeSecretKey),
          configuredPlatforms: st.providers.filter((p) => Boolean(p.apiKey)).map((p) => p.id)
        });
      }

      if (pathname === '/api/public/catalog' && req.method === 'GET') {
        const st = await getState();
        return json(res, 200, {
          appName: 'Abli Code',
          contactEmail: st.settings.contactEmail,
          dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
          stripeConfigured: Boolean(st.settings.stripeSecretKey),
          plans: Object.values(PLANS).map(sanitizePublicPlan),
          topUpPacks: TOPUP_PACKS,
          platforms: [],
          models: st.models.map(({ platform, upstreamModelId, ...m }) => ({
            ...m,
            inputCostPer1M: sellPrices(m).input,
            outputCostPer1M: sellPrices(m).output,
            providerReady: Boolean(st.providers.find((p) => p.id === platform && (p.apiKey || p.id === 'ollama')))
          })),
          supabase: {
            url: st.settings.supabaseUrl,
            publishableKey: st.settings.supabasePublishableKey
          }
        });
      }

      // Auth Endpoints
      if (pathname === '/api/auth/send-code' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await sendVerificationCode(body.email, body.purpose || 'signup');
        return json(res, 200, result);
      }

      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await registerWithEmail(body);
        return json(res, 201, result);
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await loginWithPassword(body);
        return json(res, 200, result);
      }

      if (pathname === '/api/auth/oauth' && req.method === 'GET') {
        const provider = urlObj.searchParams.get('provider') || 'github';
        const redirectTo = urlObj.searchParams.get('redirectTo') || undefined;
        const result = await getOAuthAuthorizeUrl(provider, redirectTo);
        return json(res, 200, result);
      }

      // Desktop sign-in through the default browser
      if (pathname === '/api/auth/desktop/start' && req.method === 'GET') {
        pruneDesktopLogins();
        const provider = urlObj.searchParams.get('provider') === 'google' ? 'google' : 'github';
        const loginId = crypto.randomBytes(24).toString('hex');
        desktopLogins.set(loginId, { status: 'pending', createdAt: Date.now() });
        const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
        const result = await getOAuthAuthorizeUrl(provider, `${origin}/auth/desktop-callback?login=${loginId}`);
        return json(res, 200, { url: result.url, loginId });
      }

      if (pathname === '/auth/desktop-callback' && req.method === 'GET') {
        return serveStatic(res, path.join(ROOT_DIR, 'public', 'desktop-callback.html'));
      }

      if (pathname === '/api/auth/desktop/complete' && req.method === 'POST') {
        const body = await readBody(req);
        const entry = desktopLogins.get(String(body.loginId || ''));
        if (!entry || entry.status !== 'pending') {
          return json(res, 400, { error: 'This sign-in request expired. Start again from the Abli Code app.' });
        }
        const result = await exchangeSupabaseAccessToken(body.accessToken);
        desktopLogins.set(body.loginId, { status: 'done', createdAt: entry.createdAt, result });
        return json(res, 200, { ok: true });
      }

      if (pathname === '/api/auth/desktop/status' && req.method === 'GET') {
        const id = urlObj.searchParams.get('login') || '';
        const entry = desktopLogins.get(id);
        if (!entry) return json(res, 200, { status: 'expired' });
        if (entry.status === 'done') {
          desktopLogins.delete(id);
          return json(res, 200, { status: 'done', ...entry.result });
        }
        return json(res, 200, { status: 'pending' });
      }

      if (pathname === '/api/auth/supabase-exchange' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await exchangeSupabaseAccessToken(body.accessToken);
        return json(res, 200, result);
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Not authenticated' });
        await syncBilling(user);
        return json(res, 200, { user: sanitizeUser(user) });
      }

      if (pathname === '/api/search' && req.method === 'GET') {
        const su = await getUserByToken(getBearer(req));
        if (!su) return json(res, 401, { error: 'Sign in to search the web.' });
        if (!allowSearch(su.id)) return json(res, 429, { error: 'Too many searches, try again in a minute.' });
        const sq = String(new URL(req.url, 'http://x').searchParams.get('q') || '').slice(0, 300).trim();
        if (!sq) return json(res, 200, { results: [] });
        try { return json(res, 200, { results: await searchWeb(sq) }); } catch { return json(res, 200, { results: [] }); }
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const token = getBearer(req);
        const st = await getState();
        st.sessions = st.sessions.filter((s) => s.token !== token);
        await saveState();
        return json(res, 200, { ok: true });
      }

      // Stripe Subscriptions + Credit Top-Ups
      if (pathname === '/api/billing/subscribe' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const body = await readBody(req);
        const st = await getState();
        const plan = PLANS[body.planId];
        if (!plan) return json(res, 400, { error: 'Invalid plan' });

        if (!st.settings.stripeSecretKey && plan.priceUsd > 0 && process.env.ABLI_ALLOW_FREE_PLANS !== '1') {
          return json(res, 503, { error: 'Payments are not available right now. Please try again later.' });
        }

        if (st.settings.stripeSecretKey && plan.priceUsd > 0) {
          let sw;
          try {
          sw = await switchStripeSubscription({
            secretKey: st.settings.stripeSecretKey,
            customerId: user.stripeCustomerId,
            customerEmail: user.email,
            amountUsd: plan.priceUsd,
            productName: 'Abli Code ' + plan.name + ' Plan',
            metadata: { kind: 'subscription', userId: user.id, planId: plan.id }
          });
          } catch (e) {
            return json(res, 402, { error: 'Could not switch plans. ' + (e?.message || 'The payment did not go through.') });
          }
          if (sw.switched) {
            const switched = await applySubscription(user.id, plan.id);
            return json(res, 200, { user: switched, switched: true });
          }
          const session = await createStripeCheckoutSession({
            secretKey: st.settings.stripeSecretKey,
            mode: 'subscription',
            amountUsd: plan.priceUsd,
            customerEmail: user.email,
            productName: `Abli Code ${plan.name} Plan`,
            metadata: { kind: 'subscription', userId: user.id, planId: plan.id },
            embedded: Boolean(body.embedded && st.settings.stripePublishableKey),
            successUrl: `${st.settings.appUrl}/#/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${st.settings.appUrl}/#pricing`
          });
          return json(res, 200, session.client_secret && !session.url ? { clientSecret: session.client_secret, sessionId: session.id, publishableKey: st.settings.stripePublishableKey } : { checkoutUrl: session.url, sessionId: session.id });
        }

        if (st.settings.stripeSecretKey && plan.priceUsd === 0) {
          try {
            await cancelStripeSubscriptions(st.settings.stripeSecretKey, user.stripeCustomerId, user.email);
          } catch (e) {
            return json(res, 502, { error: 'Could not end your subscription: ' + (e?.message || e) });
          }
        }
        const updated = await applySubscription(user.id, body.planId);
        return json(res, 200, { user: updated });
      }

      if (pathname === '/api/billing/topup' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const body = await readBody(req);
        const st = await getState();
        const amt = Number(body.amountUsd);
        const quote = topUpQuote(amt);
        if (!quote) return json(res, 400, { error: 'Minimum top-up is $5.00' });

        if (st.settings.stripeSecretKey) {
          const session = await createStripeCheckoutSession({
            secretKey: st.settings.stripeSecretKey,
            mode: 'payment',
            amountUsd: quote.total,
            customerEmail: user.email,
            productName: `Abli Code Credits ($${quote.credits.toFixed(2)} + $${quote.fee.toFixed(2)} service fee)`,
            metadata: { kind: 'topup', userId: user.id, amountUsd: String(quote.credits), feeUsd: String(quote.fee) },
            embedded: Boolean(body.embedded && st.settings.stripePublishableKey),
            successUrl: `${st.settings.appUrl}/#/app?topup=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${st.settings.appUrl}/#/app`
          });
          return json(res, 200, session.client_secret && !session.url ? { clientSecret: session.client_secret, sessionId: session.id, publishableKey: st.settings.stripePublishableKey } : { checkoutUrl: session.url, sessionId: session.id });
        }

        if (process.env.ABLI_ALLOW_FREE_PLANS !== '1') {
          return json(res, 503, { error: 'Payments are not available right now. Please try again later.' });
        }
        const updated = await applyTopUp(user.id, quote.credits);
        return json(res, 200, { user: updated });
      }

      if (pathname === '/api/billing/verify-session' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const body = await readBody(req);
        const st = await getState();
        if (!st.settings.stripeSecretKey) return json(res, 400, { error: 'Stripe is not configured' });

        const session = await verifyStripeCheckoutSession(st.settings.stripeSecretKey, body.sessionId);
        if (session.payment_status !== 'paid') {
          return json(res, 402, { error: 'Checkout session is not paid yet' });
        }
        st.processedStripeSessions = st.processedStripeSessions || [];
        if (st.processedStripeSessions.includes(session.id)) {
          return json(res, 200, { user: sanitizeUser(user), alreadyProcessed: true });
        }
        if (session.metadata?.userId && session.metadata.userId !== user.id) {
          return json(res, 403, { error: 'This payment belongs to a different account.' });
        }
        if (session.customer) user.stripeCustomerId = String(session.customer);
        const md = session.metadata || {};
        let updated = sanitizeUser(user);
        if (md.kind === 'subscription' && md.planId) updated = await applySubscription(user.id, md.planId);
        if (md.kind === 'topup' && md.amountUsd) updated = await applyTopUp(user.id, Number(md.amountUsd));
        st.processedStripeSessions.push(session.id);
        await saveState();
        return json(res, 200, { user: updated });
      }

      if (pathname === '/api/billing/cancel' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const st = await getState();
        if (st.settings.stripeSecretKey) {
          await cancelStripeSubscriptions(st.settings.stripeSecretKey, user.stripeCustomerId, user.email);
        }
        const updated = await applySubscription(user.id, 'free');
        return json(res, 200, { user: updated });
      }

      if (pathname === '/api/billing/portal' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const st = await getState();
        if (!st.settings.stripeSecretKey || !user.stripeCustomerId) {
          return json(res, 400, { error: 'Complete a Stripe Checkout purchase first to open the Customer Portal.' });
        }
        const portal = await createStripePortalSession(
          st.settings.stripeSecretKey,
          user.stripeCustomerId,
          `${st.settings.appUrl}/#/app`
        );
        return json(res, 200, { url: portal.url });
      }

      if (pathname === '/api/billing/stripe-webhook' && req.method === 'POST') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks).toString('utf8');
        const st = await getState();
        let ev;
        if (st.settings.stripeWebhookSecret && st.settings.stripeSecretKey) {
          try {
            ev = verifyStripeWebhookEvent(st.settings.stripeSecretKey, raw, req.headers['stripe-signature'], st.settings.stripeWebhookSecret);
          } catch {
            return json(res, 400, { error: 'Bad signature' });
          }
        } else if (process.env.ABLI_ALLOW_UNSIGNED_WEBHOOKS === '1') {
          ev = JSON.parse(raw);
        } else {
          // Unsigned events could be forged by anyone to get a free plan, so they are refused.
          return json(res, 400, { error: 'Webhook signing is not configured.' });
        }

        if (ev.type === 'checkout.session.completed') {
          const obj = ev.data?.object || {};
          const md = obj.metadata || {};
          st.processedStripeSessions = st.processedStripeSessions || [];
          if (!st.processedStripeSessions.includes(obj.id)) {
            const targetUser = st.users.find((u) => u.id === md.userId);
            if (targetUser && obj.customer) targetUser.stripeCustomerId = String(obj.customer);
            if (md.kind === 'subscription' && md.userId && md.planId) await applySubscription(md.userId, md.planId);
            if (md.kind === 'topup' && md.userId && md.amountUsd) await applyTopUp(md.userId, Number(md.amountUsd));
            st.processedStripeSessions.push(obj.id);
            await saveState();
          }
        }
        if (ev.type === 'customer.subscription.deleted') {
          const obj = ev.data?.object || {};
          const who = st.users.find((x) => x.stripeCustomerId && x.stripeCustomerId === String(obj.customer));
          if (who && who.plan !== 'free') await applySubscription(who.id, 'free');
        }
        if (ev.type === 'invoice.paid') {
          const obj = ev.data?.object || {};
          if (obj.billing_reason === 'subscription_cycle') {
            const who = st.users.find((x) => x.stripeCustomerId && x.stripeCustomerId === String(obj.customer));
            if (who) {
              who.currentCycleSpendUsd = 0;
              who.cycleStartedAt = Date.now();
              await saveState();
            }
          }
        }
        return json(res, 200, { received: true });
      }

      if (pathname === '/api/billing/history' && req.method === 'GET') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Sign in required' });
        const st = await getState();
        return json(res, 200, {
          transactions: st.transactions
            .filter((t) => t.userId === user.id)
            .slice(0, 50)
            .map(({ spendCapGrantedUsd, ...rest }) => rest),
          usage: st.usageLedger.filter((u) => u.userId === user.id).slice(0, 50)
        });
      }

      // Operator Setup (API keys, platforms & Stripe)
      if (pathname === '/api/admin/config' && req.method === 'GET') {
        const user = await getUserByToken(getBearer(req));
        const st = await getState();
        const isAllowed = user?.role === 'admin' || req.headers.host?.startsWith('localhost') || req.headers.host?.startsWith('127.0.0.1');
        if (!isAllowed) return json(res, 403, { error: 'Operator access only' });

        return json(res, 200, {
          settings: {
            ...st.settings,
            supabaseServiceRoleKey: maskKey(st.settings.supabaseServiceRoleKey),
            resendApiKey: maskKey(st.settings.resendApiKey),
            stripeSecretKey: maskKey(st.settings.stripeSecretKey),
            stripeWebhookSecret: maskKey(st.settings.stripeWebhookSecret),
            hasServiceRoleKey: Boolean(st.settings.supabaseServiceRoleKey),
            hasResendKey: Boolean(st.settings.resendApiKey),
            hasStripeKey: Boolean(st.settings.stripeSecretKey),
            hasStripeWebhook: Boolean(st.settings.stripeWebhookSecret)
          },
          providers: st.providers.map((p) => ({
            ...p,
            apiKeyMasked: maskKey(p.apiKey),
            hasApiKey: Boolean(p.apiKey),
            apiKey: ''
          })),
          models: st.models
        });
      }

      if (pathname === '/api/admin/config' && req.method === 'POST') {
      return json(res, 410, { error: 'API keys and Stripe keys are set in the .env file on the server only.' });
    }
    if (pathname === '/api/admin/config-disabled' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        const isAllowed = user?.role === 'admin' || req.headers.host?.startsWith('localhost') || req.headers.host?.startsWith('127.0.0.1');
        if (!isAllowed) return json(res, 403, { error: 'Operator access only' });

        const body = await readBody(req);
        const st = await getState();

        if (body.settings) {
          for (const key of ['appUrl', 'contactEmail', 'adminEmail', 'supabaseUrl', 'supabasePublishableKey', 'emailFrom']) {
            if (typeof body.settings[key] === 'string') st.settings[key] = body.settings[key].trim();
          }
          if (body.settings.supabaseServiceRoleKey && !body.settings.supabaseServiceRoleKey.includes('****')) {
            st.settings.supabaseServiceRoleKey = body.settings.supabaseServiceRoleKey.trim();
          }
          if (body.settings.resendApiKey && !body.settings.resendApiKey.includes('****')) {
            st.settings.resendApiKey = body.settings.resendApiKey.trim();
          }
          if (body.settings.stripeSecretKey && !body.settings.stripeSecretKey.includes('****')) {
            st.settings.stripeSecretKey = body.settings.stripeSecretKey.trim();
          }
          if (body.settings.stripeWebhookSecret && !body.settings.stripeWebhookSecret.includes('****')) {
            st.settings.stripeWebhookSecret = body.settings.stripeWebhookSecret.trim();
          }
        }

        if (Array.isArray(body.providers)) {
          for (const incoming of body.providers) {
            const target = st.providers.find((p) => p.id === incoming.id);
            if (target) {
              if (typeof incoming.baseUrl === 'string') target.baseUrl = incoming.baseUrl.trim();
              if (typeof incoming.enabled === 'boolean') target.enabled = incoming.enabled;
              if (incoming.apiKey && !incoming.apiKey.includes('****')) {
                target.apiKey = incoming.apiKey.trim();
                target.enabled = true;
              }
            }
          }
        }

        if (Array.isArray(body.models)) {
          st.models = body.models;
        }

        await saveState();
        return json(res, 200, { ok: true, message: 'Settings saved and live.' });
      }

      if (pathname === '/api/admin/test-provider' && req.method === 'POST') {
        const body = await readBody(req);
        const st = await getState();
        const provider = st.providers.find((p) => p.id === body.providerId);
        if (!provider) return json(res, 404, { error: 'Provider not found' });
        const key = body.apiKey && !body.apiKey.includes('****') ? body.apiKey : provider.apiKey;
        const base = (body.baseUrl || provider.baseUrl || '').replace(/\/$/, '');
        if (!base) return json(res, 400, { error: 'Base URL required' });
        try {
          const r = await fetch(`${base}/models`, {
            headers: key ? { Authorization: `Bearer ${key}` } : {}
          });
          return json(res, 200, { ok: r.ok, status: r.status, message: r.ok ? 'Connection verified!' : `HTTP ${r.status}` });
        } catch (err) {
          return json(res, 200, { ok: false, message: err.message });
        }
      }

      // Chat Completions + Quota Enforcement
      if (pathname === '/api/chat/completions' && req.method === 'POST') {
        const user = await getUserByToken(getBearer(req));
        if (user && !chatRateOk(user.id)) return json(res, 429, { error: 'You are sending messages too fast. Wait a few seconds and try again.' });
        const body = await readBody(req, 16 * 1024 * 1024);
        const st = await getState();
        const model = st.models.find((m) => m.slug === body.modelSlug) || st.models[0];

        const gate = checkQuota(user, model);
        if (!gate.allowed) {
          return json(res, gate.code === 'AUTH_REQUIRED' ? 401 : 402, {
            error: gate.message,
            code: gate.code
          });
        }

        const result = await runChatCompletion({
          model,
          messages: Array.isArray(body.messages) ? sanitizeMessages(body.messages) : [],
          enableTools: body.enableTools !== false && toolsAllowed(req),
          computerControlEnabled: Boolean(body.computerControlEnabled),
          enabledServers: toolsAllowed(req) && Array.isArray(body.enabledServers) ? body.enabledServers : [],
          workspacePath: toolsAllowed(req) && typeof body.workspacePath === 'string' ? body.workspacePath : ''
        });

        const updatedUser = await recordUsage(
          user.id,
          model,
          result.promptTokens,
          result.completionTokens
        );

        return json(res, 200, {
          ...result,
          modelSlug: model.slug,
          user: updatedUser
        });
      }

      if ((pathname.startsWith('/api/mcp/') || pathname === '/api/terminal/exec') && !toolsAllowed(req)) {
        return json(res, 403, { error: 'Tools are only available in the desktop app.' });
      }
      if (pathname === '/mcp' && !isLocalReq(req)) {
        return json(res, 403, { error: 'Not available.' });
      }

      // MCP Hub APIs
      if (pathname === '/api/mcp/servers' && req.method === 'GET') {
        const servers = await loadMcpServers();
        return json(res, 200, { servers });
      }

      if (pathname === '/api/mcp/servers' && req.method === 'POST') {
        const body = await readBody(req);
        const created = await saveCustomMcpServer(body);
        return json(res, 201, { server: created });
      }

      if (pathname.startsWith('/api/mcp/servers/') && req.method === 'DELETE') {
        const id = decodeURIComponent(pathname.replace('/api/mcp/servers/', ''));
        await deleteCustomMcpServer(id);
        return json(res, 200, { ok: true });
      }

      if (pathname === '/api/mcp/tools' && req.method === 'GET') {
        const tools = await listMcpTools();
        return json(res, 200, { tools });
      }

      if (pathname === '/api/mcp/invoke' && req.method === 'POST') {
        const body = await readBody(req);
        const output = await invokeMcpTool(body.serverId, body.toolName, body.arguments || {});
        return json(res, 200, { ok: true, output });
      }

      // Streamable HTTP MCP Endpoint (Stock REA MCP over HTTP JSON-RPC 2.0)
      if (pathname === '/mcp' && req.method === 'POST') {
        const body = await readBody(req);
        const { id, method, params } = body;
        if (method === 'initialize') {
          return json(res, 200, {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: { name: 'abli-code-rea-mcp', version: '1.0.0' },
              capabilities: { tools: {} }
            }
          });
        }
        if (method === 'tools/list') {
          return json(res, 200, { jsonrpc: '2.0', id, result: { tools: REA_TOOLS } });
        }
        if (method === 'tools/call') {
          const out = await executeReaTool(params?.name, params?.arguments || {});
          return json(res, 200, {
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] }
          });
        }
        return json(res, 200, { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
      }

      // Computer Command Execution (used by Computer Control panel)
      if (pathname === '/api/terminal/exec' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await executeComputerTool('computer_run_shell', {
          command: body.command,
          cwd: body.cwd
        });
        return json(res, 200, result);
      }

      // Static Frontend Serving (dist/)
      const distDir = path.join(ROOT_DIR, 'dist');
      const requested = pathname === '/' ? '/index.html' : pathname;
      const safePath = path.normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
      const candidate = path.join(distDir, safePath);

      try {
        const stat = await fs.stat(candidate);
        if (stat.isFile()) {
          return await serveStatic(res, candidate);
        }
      } catch {
        // SPA fallback to dist/index.html
      }

      try {
        return await serveStatic(res, path.join(distDir, 'index.html'));
      } catch {
        return json(res, 503, { error: 'Frontend not built yet. Run `npm run build` first.' });
      }
    } catch (err) {
      return json(res, 400, { error: err?.message || String(err) });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const port = Number(process.env.PORT || 4747);
  const server = createAbliServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`\n  Abli Code gateway & landing page live -> http://127.0.0.1:${port}`);
    console.log(`  MCP endpoint                         -> http://127.0.0.1:${port}/mcp\n`);
  });
}

