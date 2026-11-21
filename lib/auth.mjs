import crypto from 'node:crypto';
import {
  createSession,
  getState,
  getSupabaseClients,
  hashPassword,
  sanitizeUser,
  saveState,
  verifyPassword
} from './store.mjs';

function hashCode(email, code) {
  return crypto.createHash('sha256').update(`${email.trim().toLowerCase()}:${code}`).digest('hex');
}

function verificationHtml(code, email) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,monospace;">
  <div style="max-width:520px;margin:32px auto;border:1px solid #262626;background:#0b0b0b;padding:32px;">
    <div style="border-bottom:2px solid #ff1e38;padding-bottom:16px;margin-bottom:24px;">
      <span style="font-size:18px;font-weight:900;letter-spacing:0.12em;color:#ffffff;">ABLI <span style="color:#ff1e38;">CODE</span></span>
    </div>
    <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;">Verification code requested for <strong style="color:#ffffff;">${email}</strong></p>
    <div style="margin:24px 0;padding:20px;background:#050505;border:1px solid #ff1e38;text-align:center;">
      <span style="font-size:34px;font-weight:800;letter-spacing:0.35em;color:#ffffff;">${code}</span>
    </div>
    <p style="margin:0 0 18px;color:#a1a1aa;font-size:12px;">Expires in 10 minutes. Never share this code with anyone.</p>
    <div style="border-top:1px solid #1f1f23;padding-top:16px;font-size:11px;color:#71717a;">
      Support: <a href="mailto:umaralfatehsuhaimi02@gmail.com" style="color:#ff1e38;">umaralfatehsuhaimi02@gmail.com</a>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationCode(email, purpose = 'signup') {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || !clean.includes('@')) throw new Error('Valid email is required.');

  const st = await getState();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record = {
    id: crypto.randomUUID(),
    email: clean,
    codeHash: hashCode(clean, code),
    purpose,
    attempts: 0,
    expiresAt: Date.now() + 10 * 60 * 1000,
    used: false,
    createdAt: Date.now()
  };

  st.verificationCodes = st.verificationCodes.filter((c) => c.email !== clean || c.used);
  st.verificationCodes.push(record);
  await saveState();

  const brevoKey = st.settings.brevoApiKey;
  if (brevoKey) {
    // Brevo: 300 free emails a day. Set BREVO_TEMPLATE_ID to use a template you design in Brevo's editor.
    const templateId = Number(st.settings.brevoTemplateId || 0);
    const payload = templateId
      ? { to: [{ email: clean }], templateId, params: { CODE: code, EMAIL: clean } }
      : { sender: parseSender(st.settings.emailFrom), to: [{ email: clean }], subject: code + ' is your Abli Code verification code', htmlContent: verificationHtml(code, clean) };
    const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!sent.ok) throw new Error('Email delivery error: ' + (await sent.text()));
    return { ok: true, delivered: true, channel: 'brevo' };
  }

  const resendKey = st.settings.resendApiKey;
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: st.settings.emailFrom || 'Abli Code <onboarding@resend.dev>',
        to: [clean],
        subject: `${code} is your Abli Code verification code`,
        html: verificationHtml(code, clean)
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend delivery error: ${errText}`);
    }
    return { ok: true, delivered: true, channel: 'resend' };
  }

  return {
    ok: true,
    delivered: false,
    channel: 'local-preview',
    previewCode: code,
    note: 'Set BREVO_API_KEY in the server .env to deliver real emails to user inboxes.'
  };
}

function parseSender(from) {
  const m = String(from || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/^"|"$/g, '') || 'Abli Code', email: m[2] };
  return { name: 'Abli Code', email: String(from || '').trim() };
}

export async function verifyCodeOrThrow(email, code) {
  const clean = String(email || '').trim().toLowerCase();
  const st = await getState();
  const entry = [...st.verificationCodes].reverse().find((c) => c.email === clean && !c.used);
  if (!entry) throw new Error('No active verification code found. Request a new 6-digit code.');
  if (Date.now() > entry.expiresAt) throw new Error('Verification code expired. Request a new code.');
  if (entry.attempts >= 5) throw new Error('Too many wrong attempts. Request a new code.');

  entry.attempts += 1;
  if (entry.codeHash !== hashCode(clean, String(code || '').trim())) {
    await saveState();
    throw new Error('Invalid 6-digit verification code.');
  }
  entry.used = true;
  await saveState();
  return true;
}

export async function registerWithEmail({ email, password, name, code }) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean.includes('@')) throw new Error('Valid email is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  await verifyCodeOrThrow(clean, code);

  const st = await getState();
  if (st.users.some((u) => u.email === clean)) {
    throw new Error('An account with this email already exists. Please sign in.');
  }

  const isAdmin = clean === st.settings.adminEmail.toLowerCase();
  const user = {
    id: crypto.randomUUID(),
    email: clean,
    name: String(name || clean.split('@')[0]).trim(),
    passwordHash: hashPassword(password),
    role: isAdmin ? 'admin' : 'user',
    emailVerified: true,
    authProvider: 'email',
    plan: isAdmin ? 'max' : 'free',
    subscriptionPriceUsd: isAdmin ? 100 : 0,
    spendCapUsd: isAdmin ? 150 : 0,
    currentCycleSpendUsd: 0,
    creditBalanceUsd: isAdmin ? 25 : 0,
    dailyFreeTokens: {},
    createdAt: new Date().toISOString()
  };

  st.users.push(user);
  await saveState();

  // Best-effort sync into Supabase Auth if configured
  const { publicClient } = await getSupabaseClients();
  if (publicClient) {
    try {
      await publicClient.auth.signUp({
        email: clean,
        password,
        options: { data: { full_name: user.name } }
      });
    } catch {
      // Non-blocking: local verified ledger still succeeds
    }
  }

  const token = await createSession(user.id);
  return { token, user: sanitizeUser(user) };
}

export async function loginWithPassword({ email, password }) {
  const clean = String(email || '').trim().toLowerCase();
  const st = await getState();
  const user = st.users.find((u) => u.email === clean);

  if (user && user.passwordHash && verifyPassword(password, user.passwordHash)) {
    const token = await createSession(user.id);
    return { token, user: sanitizeUser(user) };
  }

  // Fallback check against Supabase Auth if user registered directly in Supabase
  const { publicClient } = await getSupabaseClients();
  if (publicClient) {
    const { data, error } = await publicClient.auth.signInWithPassword({ email: clean, password });
    if (!error && data?.user) {
      return upsertOAuthUser({
        email: data.user.email,
        name: data.user.user_metadata?.full_name || clean.split('@')[0],
        provider: 'supabase'
      });
    }
  }

  throw new Error('Invalid email or password.');
}

export async function getOAuthAuthorizeUrl(provider, redirectTo) {
  const allowed = ['github', 'google'];
  if (!allowed.includes(provider)) throw new Error('Unsupported OAuth provider. Use github or google.');

  const st = await getState();
  const supabaseUrl = st.settings.supabaseUrl;
  const targetRedirect = redirectTo || `${st.settings.appUrl}/auth/callback`;

  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured. Add it in Operator Setup.');
  }

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/authorize`);
  url.searchParams.set('provider', provider);
  url.searchParams.set('redirect_to', targetRedirect);
  return { url: url.toString(), provider };
}

export async function exchangeSupabaseAccessToken(accessToken) {
  const { publicClient } = await getSupabaseClients();
  if (!publicClient) throw new Error('Supabase client is not configured.');

  const { data, error } = await publicClient.auth.getUser(accessToken);
  if (error || !data?.user?.email) {
    throw new Error(error?.message || 'Failed to validate OAuth token with Supabase.');
  }

  return upsertOAuthUser({
    email: data.user.email,
    name: data.user.user_metadata?.full_name || data.user.user_metadata?.user_name || data.user.email.split('@')[0],
    provider: data.user.app_metadata?.provider || 'oauth'
  });
}

export async function upsertOAuthUser({ email, name, provider }) {
  const clean = String(email || '').trim().toLowerCase();
  const st = await getState();
  let user = st.users.find((u) => u.email === clean);
  const isAdmin = clean === st.settings.adminEmail.toLowerCase();

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email: clean,
      name: name || clean.split('@')[0],
      passwordHash: null,
      role: isAdmin ? 'admin' : 'user',
      emailVerified: true,
      authProvider: provider,
      plan: isAdmin ? 'max' : 'free',
      subscriptionPriceUsd: isAdmin ? 100 : 0,
      spendCapUsd: isAdmin ? 150 : 0,
      currentCycleSpendUsd: 0,
      creditBalanceUsd: isAdmin ? 25 : 0,
      dailyFreeTokens: {},
      createdAt: new Date().toISOString()
    };
    st.users.push(user);
    await saveState();
  }

  const token = await createSession(user.id);
  return { token, user: sanitizeUser(user) };
}
