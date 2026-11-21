import { getState } from './store.mjs';
import { estimateTokens } from './pricing.mjs';
import { invokeMcpTool, listMcpTools } from '../mcp/client.mjs';

const SYSTEM_PROMPT = `You are Abli Code, a sharp coding assistant with workspace, computer, and MCP tools.
When tools are enabled, inspect files and run checks directly instead of guessing.
Be direct, concise, and helpful.`;

function textOf(content) {
  if (!Array.isArray(content)) return typeof content === 'string' ? content : '';
  return content.filter((p) => p && p.type === 'text').map((p) => p.text).join(' ');
}
function imageCount(content) {
  return Array.isArray(content) ? content.filter((p) => p && p.type === 'image_url').length : 0;
}

function personaFor(model) {
  const name = model && model.name;
  if (!name || /^Muse Spark/i.test(name)) return '';
  const spec = /^Abli Coder/i.test(name)
    ? ' You specialize in software engineering: write, debug, and refactor code carefully, and explain changes briefly.'
    : /^Abli Flash/i.test(name)
      ? ' You are tuned for speed: answer quickly and concisely.'
      : '';
  return 'You are ' + name + ', a model made by Abli Code. Always refer to yourself as ' + name + '. If someone asks who you are, which model you are, or who made you, answer that you are ' + name + ' from Abli Code. Do not name any other model or lab as your identity.' + spec;
}

export async function resolveProviderForModel(model) {
  const st = await getState();
  const provider = st.providers.find((p) => p.id === model.platform);
  if (!provider) return null;
  if (provider.id === 'ollama' && provider.baseUrl) {
    return provider;
  }
  if (!provider.apiKey || !provider.baseUrl) return null;
  return provider;
}

export async function runChatCompletion({
  model,
  messages,
  enableTools = true,
  computerControlEnabled = false,
  enabledServers = null,
  workspacePath = ''
}) {
  const provider = await resolveProviderForModel(model);
  const allMcpTools = enableTools ? await listMcpTools() : [];
  const allowedTools = allMcpTools.filter((t) => {
    if (t.error) return false;
    if (Array.isArray(enabledServers)) {
      if (!enabledServers.includes(t.serverId)) return false;
    } else if (t.serverId === 'stock-computer' && !computerControlEnabled) {
      return false;
    }
    return true;
  });

  if (!provider) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const activeToolNames = Array.from(new Set(allowedTools.map((t) => t.serverName)));
    const hint = `No API key configured for **${model.platform}** yet, so **${model.name}** is running in preview mode.\n\n` +
      `Open **Settings -> API Keys** to add your **${model.platform}** key and go live immediately.\n\n` +
      `- Active folder: \`${workspacePath || 'none selected'}\`\n` +
      `- Enabled tools: ${activeToolNames.length ? activeToolNames.join(', ') : 'none'}\n` +
      `- Prompt received: \`${lastUser.slice(0, 140)}\``;

    const promptTokens = messages.reduce((acc, m) => acc + estimateTokens(textOf(m.content)) + 1000 * imageCount(m.content), 0);
    const completionTokens = estimateTokens(hint);
    return {
      content: hint,
      promptTokens,
      completionTokens,
      toolTrace: [],
      demoMode: true
    };
  }

  const endpoint = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (provider.apiKey) {
    headers.Authorization = `Bearer ${provider.apiKey}`;
  }
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ablicode.dev';
    headers['X-Title'] = 'Abli Code';
  }

  const openAiTools = allowedTools.map((t) => ({
    type: 'function',
    function: {
      name: `${t.serverId}__${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      description: `[${t.serverName}] ${t.description || t.name}`,
      parameters: t.inputSchema || { type: 'object', properties: {} }
    }
  }));

  const toolLookup = new Map(
    allowedTools.map((t) => [`${t.serverId}__${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_'), t])
  );

  const sysMsg = workspacePath
    ? `${SYSTEM_PROMPT}\nActive workspace directory: ${workspacePath}`
    : SYSTEM_PROMPT;

  const persona = personaFor(typeof model !== 'undefined' ? model : null);
  const convo = [{ role: 'system', content: persona ? sysMsg + String.fromCharCode(10) + persona : sysMsg }, ...messages];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const toolTrace = [];

  for (let hop = 0; hop < 6; hop++) {
    const body = {
      model: model.upstreamModelId,
      messages: convo,
      temperature: 0.2
    };
    if (openAiTools.length) {
      body.tools = openAiTools;
      body.tool_choice = 'auto';
    }

    // Busy or warming models answer 429/502/503 with a retry-after. Wait and try again before giving up.
    const payload = JSON.stringify(body);
    let res;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(endpoint, { method: 'POST', headers, body: payload });
      if (![429, 502, 503].includes(res.status) || attempt === 2) break;
      const waitSec = Math.min(20, Number(res.headers.get('retry-after')) || 5 * (attempt + 1));
      await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
    }

    if (!res.ok) {
      if (res.status === 429) throw new Error('This model is busy right now. Try again in a few seconds or switch models.');
      const errText = await res.text();
      throw new Error(`${provider.name} (${res.status}): ${errText.slice(0, 400)}`);
    }

    const data = await res.json();
    const usage = data.usage || {};
    totalPromptTokens += Number(usage.prompt_tokens || estimateTokens(JSON.stringify(convo.map((m) => ({ ...m, content: textOf(m.content) })))) + convo.reduce((n, m) => n + 1000 * imageCount(m.content), 0));
    const choice = data.choices?.[0];
    const msg = choice?.message || {};
    totalCompletionTokens += Number(usage.completion_tokens || estimateTokens(msg.content || ''));

    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        const fnName = tc.function?.name;
        const meta = toolLookup.get(fnName);
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.function?.arguments || '{}');
        } catch {
          parsedArgs = {};
        }

        let output;
        try {
          if (!meta) throw new Error(`Tool ${fnName} not mounted`);
          output = await invokeMcpTool(meta.serverId, meta.name, parsedArgs);
        } catch (err) {
          output = { error: err.message };
        }
        toolTrace.push({ serverId: meta?.serverId, tool: meta?.name || fnName, args: parsedArgs, output });
        convo.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(output).slice(0, 16000)
        });
      }
      continue;
    }

    return {
      content: msg.content || '(empty response)',
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      toolTrace,
      demoMode: false
    };
  }

  return {
    content: 'Completed maximum tool steps. Check the tool trace above for outputs.',
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    toolTrace,
    demoMode: false
  };
}
