export const DAILY_FREE_TOKEN_LIMIT = 750_000;

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    capMultiplier: 1.5,
    spendCapUsd: 0,
    badge: 'Starter',
    tagline: 'Try free models daily with the desktop app, computer control, and MCP tools.',
    features: [
      'Access to all Free models (750K tokens/day per model)',
      'Desktop app with model switching & tool toggles',
      'Built-in MCP support & local workspace tools',
      'Add credit top-ups anytime to unlock paid models'
    ]
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    priceUsd: 20,
    capMultiplier: 1.5,
    spendCapUsd: 30,
    badge: 'Popular',
    tagline: 'Everyday coding speed with cheap and fast models plus higher monthly allowance.',
    features: [
      'Generous monthly usage across Free & Cheap models',
      'GLM 5.3 Flash, Qwen Coder & DeepSeek R1 Distill',
      'Full Computer Control & custom MCP servers',
      'Seamless Stripe credit top-ups anytime'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 50,
    capMultiplier: 1.5,
    spendCapUsd: 75,
    badge: 'Pro',
    tagline: 'Built for daily full-stack shipping with flagship reasoning models included.',
    features: [
      'Expanded monthly usage across all models',
      'Includes GLM 5.3, Kimi K2 & Qwen3 Max',
      'Multi-tool desktop agent & codebase workflows',
      'Priority routing & instant credit top-ups'
    ]
  },
  max: {
    id: 'max',
    name: 'Max',
    priceUsd: 100,
    capMultiplier: 1.5,
    spendCapUsd: 150,
    badge: 'Power',
    tagline: 'Maximum monthly headroom for heavy coding, multi-repo architecture, and automation.',
    features: [
      'Our highest monthly usage allowance',
      'Unrestricted access to every Free, Cheap & Flagship model',
      'Full desktop automation & multi-MCP orchestration',
      'Instant Stripe top-ups if you ever run out'
    ]
  }
};

export const TOPUP_PACKS = [
  { id: 'topup-10', label: '+$10 Credits', amountUsd: 10, creditsUsd: 10 },
  { id: 'topup-25', label: '+$25 Credits', amountUsd: 25, creditsUsd: 25 },
  { id: 'topup-50', label: '+$50 Credits', amountUsd: 50, creditsUsd: 50 },
  { id: 'topup-100', label: '+$100 Credits', amountUsd: 100, creditsUsd: 100 }
];

export const PLATFORM_PRESETS = [
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'chutes', name: 'Chutes AI', baseUrl: 'https://llm.chutes.ai/v1' },
  { id: 'deepinfra', name: 'DeepInfra', baseUrl: 'https://api.deepinfra.com/v1/openai' },
  { id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1' },
  { id: 'fireworks', name: 'Fireworks AI', baseUrl: 'https://api.fireworks.ai/inference/v1' },
  { id: 'huggingface', name: 'Hugging Face Router', baseUrl: 'https://router.huggingface.co/v1' },
  { id: 'ollama', name: 'Local Ollama / vLLM', baseUrl: 'http://127.0.0.1:11434/v1' },
  { id: 'custom', name: 'Custom OpenAI-Compatible', baseUrl: '' }
];

export const DEFAULT_MODELS = [
  // FREE MODELS — 750,000 tokens/day PER MODEL
  {
    slug: 'deepseek-abliterated',
    name: 'DeepSeek V3 Abliterated',
    family: 'DeepSeek',
    tier: 'free',
    speedBadge: 'Free · 750K/day',
    platform: 'openrouter',
    upstreamModelId: 'deepseek/deepseek-chat-v3-0324:free',
    dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'General coding and reasoning. Free up to 750K tokens per day.'
  },
  {
    slug: 'glm-4.5-flash-free',
    name: 'GLM 4.5 Flash Free',
    family: 'GLM',
    tier: 'free',
    speedBadge: 'Free · 750K/day',
    platform: 'openrouter',
    upstreamModelId: 'z-ai/glm-4.5-air:free',
    dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Snappy free assistant for quick edits and questions. 750K tokens per day.'
  },
  {
    slug: 'qwen3-coder-free',
    name: 'Qwen3 Coder Free',
    family: 'Qwen',
    tier: 'free',
    speedBadge: 'Free · 750K/day',
    platform: 'openrouter',
    upstreamModelId: 'qwen/qwen3-coder:free',
    dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Free code-specialized Qwen model with its own 750K/day quota.'
  },
  {
    slug: 'llama-3.3-free',
    name: 'Llama 3.3 70B Free',
    family: 'Llama',
    tier: 'free',
    speedBadge: 'Free · 750K/day',
    platform: 'openrouter',
    upstreamModelId: 'meta-llama/llama-3.3-70b-instruct:free',
    dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Reliable open-weight 70B model. Includes its own 750K tokens/day limit.'
  },

  // CHEAP / FAST MODELS
  {
    slug: 'glm-5.3-flash-abliterated',
    name: 'GLM 5.3 Flash',
    family: 'GLM 5.3',
    tier: 'cheap',
    speedBadge: 'Cheap · Fast',
    platform: 'chutes',
    upstreamModelId: 'zai-org/GLM-5.3-Flash-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.12,
    outputCostPer1M: 0.35,
    contextWindow: 128000,
    description: 'Ultra-fast, low-cost coding model for rapid iterations and tool runs.'
  },
  {
    slug: 'qwen3-30b-cheap',
    name: 'Qwen3 Coder 30B',
    family: 'Qwen',
    tier: 'cheap',
    speedBadge: 'Cheap · Coding',
    platform: 'deepinfra',
    upstreamModelId: 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.3,
    contextWindow: 131072,
    description: 'MoE coder built for fast multi-file edits at minimal token cost.'
  },
  {
    slug: 'deepseek-r1-cheap',
    name: 'DeepSeek R1 Distill',
    family: 'DeepSeek',
    tier: 'cheap',
    speedBadge: 'Cheap · Reasoning',
    platform: 'deepinfra',
    upstreamModelId: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.18,
    outputCostPer1M: 0.45,
    contextWindow: 128000,
    description: 'Affordable step-by-step reasoning for debugging and planning.'
  },
  {
    slug: 'gemma-3-27b-cheap',
    name: 'Gemma 3 27B',
    family: 'Gemma',
    tier: 'cheap',
    speedBadge: 'Cheap · Lite',
    platform: 'openrouter',
    upstreamModelId: 'google/gemma-3-27b-it',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.08,
    outputCostPer1M: 0.2,
    contextWindow: 128000,
    description: 'Lightweight, low-latency model for quick summaries and helpers.'
  },

  // FLAGSHIP / PRO MODELS
  {
    slug: 'glm-5.3-abliterated',
    name: 'GLM 5.3',
    family: 'GLM 5.3',
    tier: 'premium',
    speedBadge: 'Flagship',
    platform: 'chutes',
    upstreamModelId: 'zai-org/GLM-5.3-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 1.25,
    outputCostPer1M: 4.5,
    contextWindow: 200000,
    description: 'Flagship reasoning model for complex architecture and deep refactors.'
  },
  {
    slug: 'qwen-abliterated',
    name: 'Qwen3 Max',
    family: 'Qwen',
    tier: 'premium',
    speedBadge: 'Flagship',
    platform: 'deepinfra',
    upstreamModelId: 'Qwen/Qwen3-Coder-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.6,
    outputCostPer1M: 2.0,
    contextWindow: 131072,
    description: 'High-precision coding model for full-stack generation and tool orchestration.'
  },
  {
    slug: 'kimi-abliterated',
    name: 'Kimi K2',
    family: 'Kimi',
    tier: 'premium',
    speedBadge: '256K Context',
    platform: 'openrouter',
    upstreamModelId: 'moonshotai/kimi-k2-abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 1.0,
    outputCostPer1M: 3.5,
    contextWindow: 256000,
    description: 'Long-context flagship model for large repositories and multi-step sessions.'
  }
];

export function estimateTokens(text = '') {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

export function calculateCostUsd(model, promptTokens, completionTokens) {
  if (!model || model.tier === 'free') return 0;
  const inCost = (promptTokens / 1_000_000) * Number(model.inputCostPer1M || 0);
  const outCost = (completionTokens / 1_000_000) * Number(model.outputCostPer1M || 0);
  return Number((inCost + outCost).toFixed(6));
}
