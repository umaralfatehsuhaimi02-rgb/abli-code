export const DAILY_FREE_TOKEN_LIMIT = 1_500_000;

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    capMultiplier: 1.5,
    spendCapUsd: 0,
    badge: '1.5M TOKENS / DAY',
    tagline: 'Free DeepSeek Abliterated up to 1,500,000 tokens/day hard limit.',
    features: [
      'DeepSeek Abliterated (Free model)',
      '1,500,000 tokens/day UTC hard stop',
      'Abli Code Terminal + Stock REA MCP',
      'Upgrade or Top-Up Credits anytime'
    ]
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    priceUsd: 20,
    capMultiplier: 1.5,
    spendCapUsd: 30,
    badge: '150% CAP · $30 SPEND',
    tagline: 'Pay $20/mo, spend up to $30.00 (150%) across premium abliterated models before hard stop.',
    features: [
      '150% API Spend Cap ($30.00 included)',
      'GLM 5.3 Flash, Qwen & DeepSeek Abliterated',
      'Full Computer Control + MCP Hub',
      'Top-up credits extend past 150% cap'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 50,
    capMultiplier: 1.5,
    spendCapUsd: 75,
    badge: '150% CAP · $75 SPEND',
    tagline: 'Pay $50/mo, spend up to $75.00 (150%) with flagship GLM 5.3 & Kimi Abliterated unlocked.',
    features: [
      '150% API Spend Cap ($75.00 included)',
      'All models: GLM 5.3, Flash, Qwen, Kimi, DeepSeek',
      'Priority routing & multi-step REA loops',
      'Seamless credit top-up rollover'
    ]
  },
  max: {
    id: 'max',
    name: 'Max',
    priceUsd: 100,
    capMultiplier: 1.5,
    spendCapUsd: 150,
    badge: '150% CAP · $150 SPEND',
    tagline: 'Pay $100/mo, get $150.00 (150%) spend ceiling before hard stop & upgrade/top-up prompt.',
    features: [
      '150% API Spend Cap ($150.00 ceiling)',
      'Unthrottled GLM 5.3, Kimi, Qwen & Custom models',
      'Desktop Computer Control + Multi-MCP agents',
      'Instant credit top-ups when $150 cap hits'
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
  {
    slug: 'deepseek-abliterated',
    name: 'DeepSeek Abliterated',
    family: 'DeepSeek',
    tier: 'free',
    platform: 'openrouter',
    upstreamModelId: 'deepseek/deepseek-chat-v3-0324:free',
    dailyFreeTokenLimit: DAILY_FREE_TOKEN_LIMIT,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Free uncensored/abliterated DeepSeek model. Hard-stops at 1,500,000 tokens/day UTC.'
  },
  {
    slug: 'glm-5.3-flash-abliterated',
    name: 'GLM 5.3 Flash Abliterated',
    family: 'GLM 5.3',
    tier: 'premium',
    platform: 'chutes',
    upstreamModelId: 'zai-org/GLM-5.3-Flash-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.35,
    outputCostPer1M: 1.1,
    contextWindow: 128000,
    description: 'High-speed abliterated GLM 5.3 Flash for instant patches, terminal agents & REA loops.'
  },
  {
    slug: 'glm-5.3-abliterated',
    name: 'GLM 5.3 Abliterated',
    family: 'GLM 5.3',
    tier: 'premium',
    platform: 'chutes',
    upstreamModelId: 'zai-org/GLM-5.3-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 1.25,
    outputCostPer1M: 4.5,
    contextWindow: 200000,
    description: 'Flagship abliterated GLM 5.3 reasoning model for deep binary analysis & full-system rebuilds.'
  },
  {
    slug: 'qwen-abliterated',
    name: 'Qwen Abliterated',
    family: 'Qwen',
    tier: 'premium',
    platform: 'deepinfra',
    upstreamModelId: 'Qwen/Qwen3-Coder-Abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 0.6,
    outputCostPer1M: 2.0,
    contextWindow: 131072,
    description: 'Precision abliterated Qwen coder built for decompiled AST recovery and multi-file edits.'
  },
  {
    slug: 'kimi-abliterated',
    name: 'Kimi Abliterated',
    family: 'Kimi',
    tier: 'premium',
    platform: 'openrouter',
    upstreamModelId: 'moonshotai/kimi-k2-abliterated',
    dailyFreeTokenLimit: 0,
    inputCostPer1M: 1.0,
    outputCostPer1M: 3.5,
    contextWindow: 256000,
    description: '256K-context abliterated Kimi model for ingesting massive disassemblies and repositories.'
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
