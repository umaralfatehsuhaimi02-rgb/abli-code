export interface ParsedMcp {
  name: string;
  transport: 'stdio' | 'http';
  command: string;
  args: string[];
  url: string;
  headers: Record<string, string>;
  env: Record<string, string>;
}

export const MCP_JSON_EXAMPLE = [
  '{',
  '  "mcpServers": {',
  '    "filesystem": {',
  '      "command": "npx",',
  '      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\projects"]',
  '    },',
  '    "remote": {',
  '      "url": "https://example.com/mcp",',
  '      "headers": { "Authorization": "Bearer ..." }',
  '    }',
  '  }',
  '}'
].join('\n');

function strMap(v: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v)) out[k] = String(val);
  }
  return out;
}

function looksLikeServer(v: any) {
  return Boolean(v && typeof v === 'object' && (v.command || v.url || v.serverUrl || v.httpUrl));
}

// Accepts the usual formats: { mcpServers: {...} }, { servers: {...} }, a bare { name: {...} } map, an array, or one server.
export function parseMcpJson(text: string): ParsedMcp[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That is not valid JSON. Check for a missing comma, quote or bracket.');
  }
  let map: Record<string, any> | null = null;
  const nested = data && (data.mcpServers || data.servers || data.mcp?.servers);
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) map = nested;
  else if (Array.isArray(data)) map = Object.fromEntries(data.map((s: any, i: number) => [s?.name || `server-${i + 1}`, s]));
  else if (looksLikeServer(data)) map = { [data.name || 'imported-server']: data };
  else if (data && typeof data === 'object' && Object.keys(data).length && Object.values(data).every(looksLikeServer)) map = data;
  if (!map || !Object.keys(map).length) {
    throw new Error('No servers found. Paste a block that has "mcpServers" in it, or one server with a "command" or "url".');
  }

  const out: ParsedMcp[] = [];
  for (const [name, raw] of Object.entries(map)) {
    const s: any = raw || {};
    const url = String(s.url || s.serverUrl || s.httpUrl || '').trim();
    let command = String(s.command || '').trim();
    let args: string[] = Array.isArray(s.args) ? s.args.map(String) : typeof s.args === 'string' ? s.args.split(/\s+/).filter(Boolean) : [];
    if (!url && !command) throw new Error(`"${name}" needs a "command" (local server) or a "url" (remote server).`);
    if (command && !args.length && /\s/.test(command)) {
      const parts = command.split(/\s+/).filter(Boolean);
      command = parts[0];
      args = parts.slice(1);
    }
    out.push({
      name,
      transport: url ? 'http' : 'stdio',
      command: url ? '' : command,
      args: url ? [] : args,
      url,
      headers: strMap(s.headers),
      env: strMap(s.env)
    });
  }
  return out;
}
