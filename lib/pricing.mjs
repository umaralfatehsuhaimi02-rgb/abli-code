export const DAILY_FREE_TOKEN_LIMIT = 750_000;

export const PLANS = {
  free: {
    id: 'free', name: 'Free', priceUsd: 0, capMultiplier: 1.5, spendCapUsd: 0,
    badge: 'Starter',
    tagline: 'Chat with free abliterated models every day.',
    features: ['Free daily tokens on the fastest models', 'Desktop app and web workspace', 'MCP servers and file tools', 'Add credits for flagship models']
  },
  plus: {
    id: 'plus', name: 'Plus', priceUsd: 20, capMultiplier: 1.5, spendCapUsd: 30,
    badge: 'Popular',
    tagline: 'Daily coding with cheap and fast abliterated models.',
    features: ['Everything in Free', 'Cheap and fast premium models', 'Computer control and MCP servers', 'Credit top-ups anytime']
  },
  pro: {
    id: 'pro', name: 'Pro', priceUsd: 50, capMultiplier: 1.5, spendCapUsd: 75,
    badge: 'Pro',
    tagline: 'Flagship abliterated models for serious daily work.',
    features: ['Everything in Plus', 'Flagship model access', 'Multi-step agent runs', 'Credit top-ups anytime']
  },
  max: {
    id: 'max', name: 'Max', priceUsd: 100, capMultiplier: 1.5, spendCapUsd: 150,
    badge: 'Max',
    tagline: 'Highest monthly allowance for heavy use.',
    features: ['Everything in Pro', 'Highest monthly allowance', 'Multi-server MCP orchestration', 'Priority support']
  }
};

// Credit top-ups: user pays credits + service fee. Fee = 5% of credits, minimum $0.80. Minimum top-up $5.
export const TOPUP_MIN_USD = 5;
export const TOPUP_FEE_PERCENT = 0.05;
export const TOPUP_FEE_MIN_USD = 0.8;

export function topUpQuote(creditsUsd) {
  const credits = Number(creditsUsd);
  if (!Number.isFinite(credits) || credits < TOPUP_MIN_USD) return null;
  const fee = Math.max(TOPUP_FEE_MIN_USD, Math.round(credits * TOPUP_FEE_PERCENT * 100) / 100);
  const total = Math.round((credits + fee) * 100) / 100;
  return { credits: Number(credits.toFixed(2)), fee: Number(fee.toFixed(2)), total };
}

export const TOPUP_PACKS = [5, 10, 25, 50, 100].map((amt) => {
  const q = topUpQuote(amt);
  return { id: `topup-${amt}`, label: `$${amt} credits`, amountUsd: amt, creditsUsd: amt, feeUsd: q.fee, totalUsd: q.total };
});

// Provider presets. Base URLs are from each provider's public docs.
export const PLATFORM_PRESETS = [
  { id: 'abliteratedllm', name: 'AbliteratedLLM', baseUrl: 'https://api.abliteratedllm.dev/v1' },
  { id: 'uplinkswitch', name: 'UplinkSwitch', baseUrl: 'https://api.uplinkswitch.com/v1' },
  { id: 'unst33r', name: 'UNST33R', baseUrl: 'https://api.unst33r.si/v1' },
  { id: 'lyber', name: 'Lyber', baseUrl: 'https://api.lyber.ai/v1' },
  { id: 'uncensoredllm', name: 'UncensoredLLM', baseUrl: 'https://uncensoredllm.ai/v1' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'featherless', name: 'Featherless AI', baseUrl: 'https://api.featherless.ai/v1' },
  { id: 'custom', name: 'Custom OpenAI-Compatible', baseUrl: '' }
];

// Only current models whose upstream IDs were confirmed in provider listings (Nov 2026).
// Prices are from each provider's listing when checked; re-verify before launch.
export const DEFAULT_MODELS = [
  { slug: 'glm-5.3-abliterated', name: 'GLM 5.3 (Abliterated)', family: 'GLM 5.3', tier: 'premium', speedBadge: 'Flagship / 200K', platform: 'unst33r', upstreamModelId: 'unst33r-pro', dailyFreeTokenLimit: 0, inputCostPer1M: 2.5, outputCostPer1M: 4.5, contextWindow: 200000, description: 'Flagship abliterated GLM 5.3 for deep reasoning, long agent runs, and large refactors.' },
  { slug: 'deepseek-v4.1-flash-abliterated', name: 'DeepSeek V4.1 Flash (Abliterated)', family: 'DeepSeek', tier: 'free', speedBadge: 'Free / Fast', platform: 'unst33r', upstreamModelId: 'unst33r-deepseek', dailyFreeTokenLimit: 750000, inputCostPer1M: 0.15, outputCostPer1M: 0.5625, contextWindow: 128000, description: 'Fast abliterated DeepSeek V4.1 Flash with tool calling.' },
  { slug: 'qwen3.8-27b-abliterated', name: 'Qwen3.8 27B (Abliterated)', family: 'Qwen', tier: 'cheap', speedBadge: 'Cheap / Coding', platform: 'uplinkswitch', upstreamModelId: 'qwen3.8-27b-abliterated-huihui', dailyFreeTokenLimit: 0, inputCostPer1M: 1.25, outputCostPer1M: 3.75, contextWindow: 131072, description: 'Abliterated Qwen3.8 27B for coding and chat.' },
  { slug: 'glm-5.3-flash-abliterated', name: 'GLM 5.3 Flash (Abliterated)', family: 'GLM 5.3', tier: 'free', speedBadge: 'Free / Fastest', platform: 'abliteratedllm', upstreamModelId: 'glm-5.3-flash-abliterated', dailyFreeTokenLimit: 5000000, inputCostPer1M: 0.08, outputCostPer1M: 0.3, contextWindow: 1000000, description: 'Fast, low-cost abliterated GLM 5.3 Flash for quick edits and tool runs.' }
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



