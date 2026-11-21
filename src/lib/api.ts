export interface FreeModelQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  authProvider: string;
  plan: 'free' | 'plus' | 'pro' | 'max';
  subscriptionPriceUsd: number;
  planUsagePercent: number;
  planLimitReached: boolean;
  creditBalanceUsd: number;
  freeUsageByModel: Record<string, FreeModelQuota>;
  freeUsedToday: number;
  freeLimitDaily: number;
  freeRemainingToday: number;
  todayUtc: string;
  createdAt: string;
}

export interface ModelConfig {
  slug: string;
  name: string;
  family: string;
  tier: 'free' | 'cheap' | 'premium';
  speedBadge?: string;
  vision?: boolean;
  platform?: string;
  upstreamModelId: string;
  dailyFreeTokenLimit: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  description: string;
  providerReady?: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  priceUsd: number;
  badge: string;
  tagline: string;
  features: string[];
}

export interface CatalogResponse {
  appName: string;
  contactEmail: string;
  dailyFreeTokenLimit: number;
  stripeConfigured: boolean;
  plans: PlanConfig[];
  topUpPacks: { id: string; label: string; amountUsd: number; creditsUsd: number }[];
  platforms: { id: string; name: string; baseUrl: string }[];
  models: ModelConfig[];
  supabase: { url: string; publishableKey: string };
}

const TOKEN_KEY = 'abli_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('abli_returning', '1');
  }
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new Error('Cannot reach the Abli Code server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  getCatalog: () => apiFetch<CatalogResponse>('/api/public/catalog'),
  getMe: () => apiFetch<{ user: UserProfile }>('/api/auth/me'),
  sendCode: (email: string, purpose = 'signup') =>
    apiFetch<{ ok: boolean; sentVia: string; message: string; devPreviewCode?: string }>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, purpose })
    }),
  register: (payload: { email: string; password: string; name: string; code: string }) =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  startDesktopLogin: (provider: 'github' | 'google') =>
    apiFetch<{ url: string; loginId: string }>(`/api/auth/desktop/start?provider=${provider}`),
  pollDesktopLogin: (loginId: string) =>
    apiFetch<{ status: 'pending' | 'expired' | 'done'; token?: string; user?: UserProfile }>(`/api/auth/desktop/status?login=${loginId}`),
  getOAuthUrl: (provider: 'github' | 'google', redirectTo: string) =>
    apiFetch<{ url: string }>(`/api/auth/oauth?provider=${provider}&redirectTo=${encodeURIComponent(redirectTo)}`),
  exchangeSupabaseToken: (accessToken: string) =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/supabase-exchange', {
      method: 'POST',
      body: JSON.stringify({ accessToken })
    }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  subscribe: (planId: string) =>
    apiFetch<{ user?: UserProfile; checkoutUrl?: string; sessionId?: string; clientSecret?: string; publishableKey?: string }>('/api/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId, embedded: true })
    }),
  verifyStripeSession: (sessionId: string) =>
    apiFetch<{ user: UserProfile }>('/api/billing/verify-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }),
  openBillingPortal: () =>
    apiFetch<{ url: string }>('/api/billing/portal', { method: 'POST' }),
  cancelPlan: () => apiFetch<{ user: UserProfile }>('/api/billing/cancel', { method: 'POST' }),
  topup: (amountUsd: number) =>
    apiFetch<{ user?: UserProfile; checkoutUrl?: string; sessionId?: string; clientSecret?: string; publishableKey?: string }>('/api/billing/topup', {
      method: 'POST',
      body: JSON.stringify({ amountUsd, embedded: true })
    }),
  billingHistory: () => apiFetch<{ transactions: any[]; usage: any[] }>('/api/billing/history'),
  chat: (payload: {
    modelSlug: string;
    messages: { role: string; content: any }[];
    enableTools: boolean;
    computerControlEnabled: boolean;
    enabledServers?: string[];
    workspacePath?: string;
  }, signal?: AbortSignal) =>
    apiFetch<{
      content: string;
      promptTokens: number;
      completionTokens: number;
      toolTrace: any[];
      demoMode: boolean;
      user: UserProfile;
    }>('/api/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal
    }),
  listMcpServers: () => apiFetch<{ servers: any[] }>('/api/mcp/servers'),
  addMcpServer: (server: any) =>
    apiFetch<{ server: any }>('/api/mcp/servers', { method: 'POST', body: JSON.stringify(server) }),
  deleteMcpServer: (id: string) =>
    apiFetch(`/api/mcp/servers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listMcpTools: () => apiFetch<{ tools: any[] }>('/api/mcp/tools'),
  invokeMcpTool: (serverId: string, toolName: string, args: any) =>
    apiFetch<{ ok: boolean; output: any }>('/api/mcp/invoke', {
      method: 'POST',
      body: JSON.stringify({ serverId, toolName, arguments: args })
    }),
  execCommand: (command: string, cwd?: string) =>
    apiFetch('/api/terminal/exec', { method: 'POST', body: JSON.stringify({ command, cwd }) }),
  getAdminConfig: () => apiFetch('/api/admin/config'),
  saveAdminConfig: (payload: any) =>
    apiFetch('/api/admin/config', { method: 'POST', body: JSON.stringify(payload) }),
  testProvider: (payload: { providerId: string; apiKey?: string; baseUrl?: string }) =>
    apiFetch('/api/admin/test-provider', { method: 'POST', body: JSON.stringify(payload) })
};
