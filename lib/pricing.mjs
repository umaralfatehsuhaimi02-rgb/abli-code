export const DAILY_FREE_TOKEN_LIMIT = 750_000;

export const PLANS = {
  free: {
    id: 'free', name: 'Free', priceUsd: 0, capMultiplier: 1.5, spendCapUsd: 0,
    badge: 'Starter',
    tagline: 'Chat with free abliterated models every day.',
    features: ['Free daily tokens on lightweight models', 'Desktop app and web workspace', 'MCP servers and file tools', 'Add credits for flagship models']
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
  { id: 'refuseless', name: 'Refuseless', baseUrl: 'https://api.refuseless.com/v1' },
  { id: 'nearai', name: 'NEAR AI Cloud', baseUrl: 'https://cloud-api.near.ai/v1' },
  { id: 'uplinkswitch', name: 'UplinkSwitch', baseUrl: 'https://api.uplinkswitch.com/v1' },
  { id: 'unst33r', name: 'UNST33R', baseUrl: 'https://api.unst33r.si/v1' },
  { id: 'lyber', name: 'Lyber', baseUrl: 'https://api.lyber.ai/v1' },
  { id: 'uncensoredllm', name: 'UncensoredLLM', baseUrl: 'https://uncensoredllm.ai/v1' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'featherless', name: 'Featherless AI', baseUrl: 'https://api.featherless.ai/v1' },
  { id: 'custom', name: 'Custom OpenAI-Compatible', baseUrl: '' }
];

// Prices are USD per 1M tokens from each provider's own price page, checked 2026-11-21.
// Free and cheap models must stay at or under $1.50 per 1M output tokens.
export const DEFAULT_MODELS = [
  // Free: small, cheap stock models. Weak on purpose so paid plans stay worth it.
  { slug: 'minimax-m3.1-flash', name: 'MiniMax M3.1 Flash', family: 'MiniMax', tier: 'free', speedBadge: 'Free / Basic', platform: 'refuseless', upstreamModelId: 'minimax-m3.1-flash', dailyFreeTokenLimit: 5000000, inputCostPer1M: 0.02, outputCostPer1M: 0.08, contextWindow: 1048576, description: 'Small, quick model for simple questions and light edits. Stock weights, so it keeps its own refusals.' },
  { slug: 'deepseek-v4.1-flash-fast', name: 'DeepSeek V4.1 Flash Fast', family: 'DeepSeek', tier: 'free', speedBadge: 'Free / Basic', platform: 'refuseless', upstreamModelId: 'deepseek-v4.1-flash-fast', dailyFreeTokenLimit: 750000, inputCostPer1M: 0.01, outputCostPer1M: 0.08, contextWindow: 1048576, description: 'Lightweight DeepSeek for everyday chat and small tasks. Stock weights, so it keeps its own refusals.' },
  // Cheap abliterated models (paid, at or under $1.50 per 1M output tokens).
  { slug: 'glm-5.3-flash-abliterated', name: 'GLM 5.3 Flash (Abliterated)', family: 'GLM 5.3', tier: 'cheap', speedBadge: 'Cheap / Fast', platform: 'abliteratedllm', upstreamModelId: 'glm-5.3-flash-abliterated', dailyFreeTokenLimit: 0, inputCostPer1M: 0.0977, outputCostPer1M: 0.3421, contextWindow: 1048576, description: 'Fast abliterated GLM 5.3 Flash for quick edits and tool runs.' },
  { slug: 'deepseek-v4.1-flash-abliterated', name: 'DeepSeek V4.1 Flash (Abliterated)', family: 'DeepSeek', tier: 'cheap', speedBadge: 'Cheap / Reasoning', platform: 'refuseless', upstreamModelId: 'deepseek-v4.1-flash-abliterated', dailyFreeTokenLimit: 0, inputCostPer1M: 0.12, outputCostPer1M: 0.45, contextWindow: 1048576, description: 'Abliterated DeepSeek V4.1 Flash with reasoning and tool calling.' },
  { slug: 'qwen3.8-27b-abliterated', name: 'Qwen3.8 27B (Abliterated)', family: 'Qwen', tier: 'cheap', speedBadge: 'Cheap / Coding', platform: 'nearai', upstreamModelId: 'Qwen/Qwen3.8-27B-abliterated', dailyFreeTokenLimit: 0, inputCostPer1M: 0.04, outputCostPer1M: 1.35, contextWindow: 262144, description: 'Abliterated Qwen3.8 27B with vision, reasoning, and tool use.' },
  // Flagships.
  { slug: 'glm-5.3-abliterated', name: 'GLM 5.3 (Abliterated)', family: 'GLM 5.3', tier: 'premium', speedBadge: 'Flagship / 1M', platform: 'refuseless', upstreamModelId: 'glm-5.3-abliterated', dailyFreeTokenLimit: 0, inputCostPer1M: 1.0, outputCostPer1M: 2.0, contextWindow: 1048576, description: 'Flagship abliterated GLM 5.3 for deep reasoning, long agent runs, and large refactors.' },
  { slug: 'kimi-k3.1-pro-abliterated', name: 'Kimi K3.1 Pro (Abliterated)', family: 'Kimi', tier: 'premium', speedBadge: 'Flagship / Preview', platform: 'refuseless', upstreamModelId: 'kimi-k3.1-pro-abliterated', dailyFreeTokenLimit: 0, inputCostPer1M: 1.5, outputCostPer1M: 3.0, contextWindow: 1048576, description: 'Abliterated Kimi K3.1 Pro preview for hard agentic coding.' },
  { slug: 'muse-spark-open', name: 'Muse Spark Open', family: 'Muse Spark', tier: 'premium', speedBadge: 'Flagship / 1M', platform: 'abliteratedllm', upstreamModelId: 'muse-spark-open', dailyFreeTokenLimit: 0, inputCostPer1M: 1.125, outputCostPer1M: 3.825, contextWindow: 1048576, description: "Meta's open-weight coding and agent model. Built with Muse Spark Open. Stock weights, so it keeps Meta's own refusals." }
];
export function estimateTokens(text = '') {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

// What users pay on top of provider cost. Cheap models stay at or under $1.50 per 1M output tokens.
export const PRICE_MARKUP = { free: 1.1, cheap: 1.1, premium: 1.25 };

const round4 = (n) => Number(n.toFixed(4));

// Selling price per 1M tokens (provider cost plus markup).
export function sellPrices(model) {
  const mult = PRICE_MARKUP[model?.tier] || 1.1;
  return {
    input: round4(Number(model?.inputCostPer1M || 0) * mult),
    output: round4(Number(model?.outputCostPer1M || 0) * mult)
  };
}

export function calculateCostUsd(model, promptTokens, completionTokens) {
  if (!model || model.tier === 'free') return 0;
  const price = sellPrices(model);
  const inCost = (promptTokens / 1_000_000) * price.input;
  const outCost = (completionTokens / 1_000_000) * price.output;
  return Number((inCost + outCost).toFixed(6));
}
