import type { ModelConfig } from './api';

export interface LocalModelInfo {
  id: string;
  slug: string;
  name: string;
  size: string;
  blurb: string;
  thinking: 'off' | 'medium';
  persona: string;
}

// Abli Mini runs on the user's own computer, so these never go through the Abli Code server.
export const LOCAL_MODELS: LocalModelInfo[] = [
  { id: 'lite', slug: 'local:lite', name: 'Abli Mini Lite', size: '2B', thinking: 'off',
    blurb: 'Tiny and instant. Quick chat and simple questions.',
    persona: 'You are small and fast. Keep answers short and direct.' },
  { id: 'flash', slug: 'local:flash', name: 'Abli Mini Flash', size: '4B', thinking: 'off',
    blurb: 'Fast and capable. Everyday chat and writing.',
    persona: 'You are fast and capable. You are best for everyday chat, writing and quick code help.' },
  { id: 'coder', slug: 'local:coder', name: 'Abli Mini Coder', size: '9B', thinking: 'off',
    blurb: 'Built for code. Write, fix and explain programs.',
    persona: 'You are especially good at programming. Give complete, working code.' },
  { id: 'coder2', slug: 'local:coder2', name: 'Abli Mini Coder 2', size: '27B', thinking: 'medium',
    blurb: 'The smartest local model. Hard problems and deep coding.',
    persona: 'You are the strongest local model, especially good at programming and hard problems. Give complete, working code.' }
];

export const isLocalSlug = (s?: string) => Boolean(s && s.startsWith('local:'));
export const localIdOf = (slug: string) => slug.replace(/^local:/, '');

export const LOCAL_CONFIGS: ModelConfig[] = LOCAL_MODELS.map((m) => ({
  slug: m.slug,
  name: m.name,
  family: 'Abli Mini',
  tier: 'free' as const,
  upstreamModelId: '',
  dailyFreeTokenLimit: 0,
  inputCostPer1M: 0,
  outputCostPer1M: 0,
  contextWindow: 8192,
  description: m.blurb
}));

export function desktopLocal(): any {
  return (window as any).abliDesktop?.local || null;
}

export class LocalNotReady extends Error {
  needsInstall = true;
}

export async function ensureLocalRunning(id: string, name: string) {
  const dl = desktopLocal();
  if (!dl) throw new Error('Abli Mini runs in the desktop app.');
  const st = await dl.status();
  if (!st.installed?.[id] || !st.engine?.installed) {
    throw new LocalNotReady(`${name} is not installed yet. Open Abli Mini to install it.`);
  }
  if (st.running?.ready && st.running.id === id) return;
  await dl.start(id);
}

// Keep the conversation inside the local context window by dropping the oldest turns first.
function trimMessages(msgs: { role: string; content: any }[], maxChars = 24000) {
  const out: { role: string; content: any }[] = [];
  let used = 0;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const len = typeof msgs[i].content === 'string' ? msgs[i].content.length : 400;
    if (out.length && used + len > maxChars) break;
    out.unshift(msgs[i]);
    used += len;
  }
  return out;
}

export async function streamLocalChat(opts: {
  id: string;
  messages: { role: string; content: any }[];
  onDelta: (text: string) => void;
  onThinking?: () => void;
  signal?: AbortSignal;
}) {
  const dl = desktopLocal();
  const ep = dl ? await dl.endpoint() : null;
  if (!ep) throw new Error('Abli Mini is not running. Open Abli Mini and load a model.');
  const info = LOCAL_MODELS.find((m) => m.id === opts.id);
  if (!info) throw new Error('Unknown local model.');
  const system = `You are ${info.name}, an AI model made by Abli Code. ${info.persona} You run privately on the user's own computer. Identity rules, always followed: your name is ${info.name} and your maker is Abli Code. You do not know, and never say, which base model, architecture, size, training data, lab or company is behind you. If asked, answer that you are ${info.name} from Abli Code and that you do not share what is under the hood. Never claim to be Mistral, Llama, Qwen, Gemma, GPT, Claude or any other model, and never invent facts about yourself such as memory use or comparisons with other models.`;
  const identityShot = [
    { role: 'user', content: 'Which model are you, and what are you based on?' },
    { role: 'assistant', content: `I am ${info.name}, made by Abli Code. I do not share what is under the hood, but I can help with whatever you are working on.` }
  ];
  const body = {
    model: 'local',
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
    chat_template_kwargs: info.thinking === 'off' ? { enable_thinking: false } : { reasoning_effort: 'medium' },
    messages: [{ role: 'system', content: system }, ...identityShot, ...trimMessages(opts.messages)]
  };
  const res = await fetch(`${ep.url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ep.key}` },
    body: JSON.stringify(body),
    signal: opts.signal
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    throw new Error(`${info.name} could not answer (${res.status}). ${t.slice(0, 160)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta || {};
        if (delta.content) opts.onDelta(delta.content);
        else if (delta.reasoning_content && opts.onThinking) opts.onThinking();
      } catch {}
    }
  }
}
