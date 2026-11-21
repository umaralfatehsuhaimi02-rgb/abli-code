export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  authProvider: string;
  plan: 'free' | 'plus' | 'pro' | 'max';
  subscriptionPriceUsd: number;
  spendCapUsd: number;
  currentCycleSpendUsd: number;
  remainingCapUsd: number;
  creditBalanceUsd: number;
  freeUsedToday: number;
  freeLimitDaily: number;
  freeRemainingToday: number;
}

export interface ModelItem {
  slug: string;
  name: string;
  family: string;
  tier: 'free' | 'premium';
  platform: string;
  upstreamModelId: string;
  dailyFreeTokenLimit: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  description: string;
  providerReady?: boolean;
}

export interface PlanItem {
  id: 'free' | 'plus' | 'pro' | 'max';
  name: string;
  priceUsd: number;
  capMultiplier: number;
  spendCapUsd: number;
  badge: string;
  tagline: string;
  features: string[];
}

export interface TopUpPack {
  id: string;
  label: string;
  amountUsd: number;
  creditsUsd: number;
}

export interface CatalogResponse {
  appName: string;
  contactEmail: string;
  dailyFreeTokenLimit: number;
  plans: PlanItem[];
  topUpPacks: TopUpPack[];
  platforms: { id: string; name: string; baseUrl: string }[];
  models: ModelItem[];
  supabase: { url: string; publishableKey: string };
}

declare global {
  interface Window {
    abliDesktop?: {
      isDesktop: boolean;
      platform: string;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      pickFolder: () => Promise<string | null>;
      pickFile: () => Promise<string | null>;
      runComputerTool: (toolName: string, args: Record<string, unknown>) => Promise<any>;
      runReaTool: (toolName: string, args: Record<string, unknown>) => Promise<any>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

const TOKEN_KEY = 'abli_session_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(t: string) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`) as Error & { code?: string; status?: number };
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  getCatalog: () => apiFetch<CatalogResponse>('/api/public/catalog'),
  getMe: () => apiFetch<{ user: UserProfile }>('/api/auth/me'),
  sendCode: (email: string, purpose = 'signup') =>
    apiFetch<{ ok: boolean; delivered: boolean; previewCode?: string; note?: string }>('/api/auth/send-code', {
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
  getOAuthUrl: (provider: 'github' | 'google') =>
    apiFetch<{ url: string; provider: string }>(
      `/api/auth/oauth?provider=${provider}&redirectTo=${encodeURIComponent(window.location.origin + '/#/auth/callback')}`
    ),
  exchangeSupabaseToken: (accessToken: string) =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/supabase-exchange', {
      method: 'POST',
      body: JSON.stringify({ accessToken })
    }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  subscribe: (planId: string) =>
    apiFetch<{ user: UserProfile }>('/api/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId })
    }),
  verifyStripeSession: (sessionId: string) =>
    apiFetch<{ user: UserProfile }>('/api/billing/verify-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    }),
  openBillingPortal: () =>
    apiFetch<{ url: string }>('/api/billing/portal', { method: 'POST' }),
  topup: (amountUsd: number) =>
    apiFetch<{ user: UserProfile }>('/api/billing/topup', {
      method: 'POST',
      body: JSON.stringify({ amountUsd })
    }),
  chat: (payload: {
    modelSlug: string;
    messages: { role: string; content: string }[];
    enableTools?: boolean;
    computerControlEnabled?: boolean;
  }) => apiFetch('/api/chat/completions', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminConfig: () => apiFetch('/api/admin/config'),
  saveAdminConfig: (payload: any) =>
    apiFetch('/api/admin/config', { method: 'POST', body: JSON.stringify(payload) }),
  testProvider: (payload: any) =>
    apiFetch<{ ok: boolean; message: string }>('/api/admin/test-provider', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listMcpServers: () => apiFetch<{ servers: any[] }>('/api/mcp/servers'),
  saveMcpServer: (srv: any) => apiFetch('/api/mcp/servers', { method: 'POST', body: JSON.stringify(srv) }),
  deleteMcpServer: (id: string) => apiFetch(`/api/mcp/servers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listMcpTools: () => apiFetch<{ tools: any[] }>('/api/mcp/tools'),
  invokeMcp: (serverId: string, toolName: string, args: Record<string, unknown>) =>
    apiFetch<{ ok: boolean; output: any }>('/api/mcp/invoke', {
      method: 'POST',
      body: JSON.stringify({ serverId, toolName, arguments: args })
    }),
  execTerminal: (command: string, cwd?: string) =>
    apiFetch<{ ok: boolean; exitCode: number; stdout: string; stderr: string }>('/api/terminal/exec', {
      method: 'POST',
      body: JSON.stringify({ command, cwd })
    })
};

