import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = __dirname;

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
import { DAILY_FREE_TOKEN_LIMIT, PLANS, PLATFORM_PRESETS, TOPUP_PACKS } from './lib/pricing.mjs';
import {
  createStripeCheckoutSession,
  createStripePortalSession,
  verifyStripeCheckoutSession,
  verifyStripeWebhookEvent
} from './lib/stripe.mjs';
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

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4 * 1024 * 1024) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function getBearer(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

function maskKey(k = '') {
  if (!k) return '';
  if (k.length <= 8) return '••••••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
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
          platforms: PLATFORM_PRESETS,
          models: st.models.map((m) => ({
            ...m,
            providerReady: Boolean(st.providers.find((p) => p.id === m.platform && (p.apiKey || p.id === 'ollama')))
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

      if (pathname === '/api/auth/supabase-exchange' && req.method === 'POST') {
        const body = await readBody(req);
        const result = await exchangeSupabaseAccessToken(body.accessToken);
        return json(res, 200, result);
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const user = await getUserByToken(getBearer(req));
        if (!user) return json(res, 401, { error: 'Not authenticated' });
        return json(res, 200, { user: sanitizeUser(user) });
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

        if (st.settings.stripeSecretKey && plan.priceUsd > 0) {
          const session = await createStripeCheckoutSession({
            secretKey: st.settings.stripeSecretKey,
            mode: 'subscription',
            amountUsd: plan.priceUsd,
            customerEmail: user.email,
            productName: `Abli Code ${plan.name} Plan`,
            metadata: { kind: 'subscription', userId: user.id, planId: plan.id },
            successUrl: `${st.settings.appUrl}/#/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${st.settings.appUrl}/#pricing`
          });
          return json(res, 200, { checkoutUrl: session.url, sessionId: session.id });
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
        if (!Number.isFinite(amt) || amt <= 0) return json(res, 400, { error: 'Invalid top-up amount' });

        if (st.settings.stripeSecretKey) {
          const session = await createStripeCheckoutSession({
            secretKey: st.settings.stripeSecretKey,
            mode: 'payment',
            amountUsd: amt,
            customerEmail: user.email,
            productName: `Abli Code Credits (+$${amt.toFixed(2)})`,
            metadata: { kind: 'topup', userId: user.id, amountUsd: String(amt) },
            successUrl: `${st.settings.appUrl}/#/app?topup=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${st.settings.appUrl}/#/app`
          });
          return json(res, 200, { checkoutUrl: session.url, sessionId: session.id });
        }

        const updated = await applyTopUp(user.id, amt);
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
        if (session.customer) user.stripeCustomerId = String(session.customer);
        const md = session.metadata || {};
        let updated = sanitizeUser(user);
        if (md.kind === 'subscription' && md.planId) updated = await applySubscription(user.id, md.planId);
        if (md.kind === 'topup' && md.amountUsd) updated = await applyTopUp(user.id, Number(md.amountUsd));
        st.processedStripeSessions.push(session.id);
        await saveState();
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
          ev = verifyStripeWebhookEvent(
            st.settings.stripeSecretKey,
            raw,
            req.headers['stripe-signature'],
            st.settings.stripeWebhookSecret
          );
        } else {
          ev = JSON.parse(raw);
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
        const user = await getUserByToken(getBearer(req));
        const isAllowed = user?.role === 'admin' || req.headers.host?.startsWith('localhost') || req.headers.host?.startsWith('127.0.0.1');
        if (!isAllowed) return json(res, 403, { error: 'Operator access only' });

        const body = await readBody(req);
        const st = await getState();

        if (body.settings) {
          for (const key of ['appUrl', 'contactEmail', 'adminEmail', 'supabaseUrl', 'supabasePublishableKey', 'emailFrom']) {
            if (typeof body.settings[key] === 'string') st.settings[key] = body.settings[key].trim();
          }
          if (body.settings.supabaseServiceRoleKey && !body.settings.supabaseServiceRoleKey.includes('••••')) {
            st.settings.supabaseServiceRoleKey = body.settings.supabaseServiceRoleKey.trim();
          }
          if (body.settings.resendApiKey && !body.settings.resendApiKey.includes('••••')) {
            st.settings.resendApiKey = body.settings.resendApiKey.trim();
          }
          if (body.settings.stripeSecretKey && !body.settings.stripeSecretKey.includes('••••')) {
            st.settings.stripeSecretKey = body.settings.stripeSecretKey.trim();
          }
          if (body.settings.stripeWebhookSecret && !body.settings.stripeWebhookSecret.includes('••••')) {
            st.settings.stripeWebhookSecret = body.settings.stripeWebhookSecret.trim();
          }
        }

        if (Array.isArray(body.providers)) {
          for (const incoming of body.providers) {
            const target = st.providers.find((p) => p.id === incoming.id);
            if (target) {
              if (typeof incoming.baseUrl === 'string') target.baseUrl = incoming.baseUrl.trim();
              if (typeof incoming.enabled === 'boolean') target.enabled = incoming.enabled;
              if (incoming.apiKey && !incoming.apiKey.includes('••••')) {
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
        const key = body.apiKey && !body.apiKey.includes('••••') ? body.apiKey : provider.apiKey;
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
        const body = await readBody(req);
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
          messages: Array.isArray(body.messages) ? body.messages : [],
          enableTools: body.enableTools !== false,
          computerControlEnabled: Boolean(body.computerControlEnabled),
          enabledServers: Array.isArray(body.enabledServers) ? body.enabledServers : null,
          workspacePath: typeof body.workspacePath === 'string' ? body.workspacePath : ''
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
