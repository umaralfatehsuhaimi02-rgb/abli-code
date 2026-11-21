import { getState } from './store.mjs';
import { estimateTokens } from './pricing.mjs';
import { invokeMcpTool, listMcpTools } from '../mcp/client.mjs';

const SYSTEM_PROMPT = `You are Abli Code, an elite open-source coding and reverse-engineering assistant running on abliterated models.
You have direct access to MCP tools:
- Stock REA MCP (rea_inspect_binary, rea_extract_strings, rea_disassemble, rea_analyze_codebase, rea_rebuild_blueprint) to inspect binaries, extract strings/endpoints, map codebases, and design clean-room rebuilds.
- Computer Control MCP (computer_run_shell, computer_read_file, computer_write_file, computer_list_dir, computer_list_windows, computer_screenshot) and any mounted external MCP servers.
Be direct, technical, and concise. Prefer verified inspection over guessing.`;

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

export async function runChatCompletion({ model, messages, enableTools = true, computerControlEnabled = false }) {
  const provider = await resolveProviderForModel(model);
  const allMcpTools = enableTools ? await listMcpTools() : [];
  const allowedTools = allMcpTools.filter((t) => {
    if (t.error) return false;
    if (t.serverId === 'stock-computer' && !computerControlEnabled) return false;
    return true;
  });

  if (!provider) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const hint = `**[Demo Router Mode — No API Key Set for \`${model.platform}\`]**\n\n` +
      `Your model **${model.name}** (\`${model.upstreamModelId}\`) is wired to platform **${model.platform}**, which currently has no API key configured.\n\n` +
      `To go live in 10 seconds:\n` +
      `1. Open **Operator Launchpad** (top right) -> paste your **${model.platform}** API key -> **Save & Go Live**.\n` +
      `2. Meanwhile, Stock **REA MCP** (${allMcpTools.filter((t) => t.serverId === 'stock-rea').length} tools) and **Computer Control** (${computerControlEnabled ? 'ON' : 'OFF'}) work locally right now.\n\n` +
      `Prompt received (${lastUser.length} chars): \`${lastUser.slice(0, 140)}\``;

    const promptTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
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

  const convo = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const toolTrace = [];

  for (let hop = 0; hop < 5; hop++) {
    const body = {
      model: model.upstreamModelId,
      messages: convo,
      temperature: 0.2
    };
    if (openAiTools.length) {
      body.tools = openAiTools;
      body.tool_choice = 'auto';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${provider.name} (${res.status}): ${errText.slice(0, 400)}`);
    }

    const data = await res.json();
    const usage = data.usage || {};
    totalPromptTokens += Number(usage.prompt_tokens || estimateTokens(JSON.stringify(convo)));
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
    content: 'Completed maximum tool hops. Inspect tool trace above for outputs.',
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    toolTrace,
    demoMode: false
  };
}
