import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { REA_TOOLS, executeReaTool } from './rea-server.mjs';
import { COMPUTER_TOOLS, executeComputerTool } from '../lib/computer-control.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const MCP_CONFIG_PATH = path.join(ROOT_DIR, '.abli-data', 'mcp-servers.json');

export const STOCK_SERVERS = [
  {
    id: 'stock-rea',
    name: 'REA MCP (Reverse Engineer Anything)',
    transport: 'builtin',
    command: 'node',
    args: ['mcp/rea-server.mjs'],
    enabled: true,
    builtin: true,
    description: 'Stock binary inspector, strings extractor, disassembler, codebase mapper & clean-room rebuild planner.'
  },
  {
    id: 'stock-computer',
    name: 'Computer Control MCP',
    transport: 'builtin',
    enabled: true,
    builtin: true,
    description: 'Native shell execution, file read/write, window list, screen capture, mouse & keyboard control.'
  }
];

async function ensureConfigDir() {
  await fs.mkdir(path.dirname(MCP_CONFIG_PATH), { recursive: true });
}

export async function loadMcpServers() {
  await ensureConfigDir();
  let custom = [];
  try {
    const raw = await fs.readFile(MCP_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) custom = parsed;
  } catch {
    custom = [];
  }
  return [...STOCK_SERVERS, ...custom];
}

export async function saveCustomMcpServer(server) {
  await ensureConfigDir();
  const all = await loadMcpServers();
  const custom = all.filter((s) => !s.builtin);
  const id = server.id || `mcp-${Date.now().toString(36)}`;
  const entry = {
    id,
    name: server.name || id,
    transport: server.transport === 'http' ? 'http' : 'stdio',
    command: server.command || '',
    args: Array.isArray(server.args)
      ? server.args
      : String(server.args || '').split(/\s+/).filter(Boolean),
    url: server.url || '',
    headers: server.headers || {},
    env: server.env && typeof server.env === 'object' && !Array.isArray(server.env) ? server.env : {},
    enabled: server.enabled !== false,
    builtin: false,
    description: server.description || 'External MCP server'
  };
  const idx = custom.findIndex((s) => s.id === id);
  if (idx >= 0) custom[idx] = entry;
  else custom.push(entry);
  await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(custom, null, 2), 'utf8');
  return entry;
}

export async function deleteCustomMcpServer(id) {
  await ensureConfigDir();
  const all = await loadMcpServers();
  const custom = all.filter((s) => !s.builtin && s.id !== id);
  await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(custom, null, 2), 'utf8');
  return { ok: true };
}

async function callStdioMcp(server, method, params = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(server.command, server.args || [], {
      cwd: ROOT_DIR,
      env: { ...process.env, ...(server.env || {}) },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });
    const rl = readline.createInterface({ input: child.stdout });
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      reject(new Error(`MCP stdio timeout (${server.name})`));
    }, 20000);

    let step = 'init';
    rl.on('line', (line) => {
      if (!line.trim()) return;
      let msg;
      try { msg = JSON.parse(line); } catch { return; }
      if (msg.id === 1 && step === 'init') {
        step = 'call';
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method, params }) + '\n');
      } else if (msg.id === 2) {
        clearTimeout(timer);
        try { child.kill(); } catch {}
        if (msg.error) reject(new Error(msg.error.message || 'MCP error'));
        else resolve(msg.result);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'abli-code', version: '1.0.0' }
        }
      }) + '\n'
    );
  });
}

async function callHttpMcp(server, method, params = {}) {
  const res = await fetch(server.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(server.headers || {})
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  if (!res.ok) throw new Error(`HTTP MCP error ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'HTTP MCP JSON-RPC error');
  return data.result;
}

export async function listMcpTools() {
  const servers = await loadMcpServers();
  const out = [];
  for (const srv of servers) {
    if (!srv.enabled) continue;
    if (srv.id === 'stock-rea') {
      out.push(...REA_TOOLS.map((t) => ({ ...t, serverId: srv.id, serverName: srv.name })));
    } else if (srv.id === 'stock-computer') {
      out.push(...COMPUTER_TOOLS.map((t) => ({ ...t, serverId: srv.id, serverName: srv.name })));
    } else {
      try {
        const res = srv.transport === 'http'
          ? await callHttpMcp(srv, 'tools/list', {})
          : await callStdioMcp(srv, 'tools/list', {});
        const tools = Array.isArray(res?.tools) ? res.tools : [];
        out.push(...tools.map((t) => ({ ...t, serverId: srv.id, serverName: srv.name })));
      } catch (err) {
        out.push({
          name: `${srv.id}__connection_error`,
          description: `Failed to list tools from ${srv.name}: ${err.message}`,
          inputSchema: { type: 'object', properties: {} },
          serverId: srv.id,
          serverName: srv.name,
          error: err.message
        });
      }
    }
  }
  return out;
}

export async function invokeMcpTool(serverId, toolName, args = {}) {
  if (serverId === 'stock-rea' || toolName.startsWith('rea_')) {
    return executeReaTool(toolName, args);
  }
  if (serverId === 'stock-computer' || toolName.startsWith('computer_')) {
    return executeComputerTool(toolName, args);
  }
  const servers = await loadMcpServers();
  const srv = servers.find((s) => s.id === serverId);
  if (!srv) throw new Error(`MCP server not found: ${serverId}`);
  const result = srv.transport === 'http'
    ? await callHttpMcp(srv, 'tools/call', { name: toolName, arguments: args })
    : await callStdioMcp(srv, 'tools/call', { name: toolName, arguments: args });
  return result;
}
