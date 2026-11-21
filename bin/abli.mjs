#!/usr/bin/env node
/**
 * Abli Code Terminal (`abli`)
 * Interactive black / white / red CLI & REPL with:
 *   - Abliterated model chat + quota meters (1.5M free / 150% plan cap)
 *   - Stock REA MCP reverse engineering commands (`/rea <path>`)
 *   - Full MCP hub (`/mcp list`, `/mcp call <serverId> <tool> <json>`)
 *   - Computer control (`/run <cmd>`, `/windows`, `/shot`)
 */

import readline from 'node:readline';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeReaTool } from '../mcp/rea-server.mjs';
import { executeComputerTool } from '../lib/computer-control.mjs';
import { invokeMcpTool, listMcpTools, loadMcpServers } from '../mcp/client.mjs';
import { checkQuota, ensureAdminUser, getState, recordUsage, sanitizeUser } from '../lib/store.mjs';
import { runChatCompletion } from '../lib/providers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[38;2;255;30;56m',
  white: '\x1b[38;2;255;255;255m',
  dim: '\x1b[38;2;161;161;170m'
};

function banner() {
  console.log(`\n${C.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.bold}${C.white}  ABLI ${C.red}CODE${C.white} TERMINAL${C.reset}  ${C.dim}v1.0.0 · Abliterated AI · REA MCP · MIT${C.reset}`);
  console.log(`${C.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.dim}  Commands: /models  /model <slug>  /usage  /rea <path>  /mcp  /run <cmd>  /exit${C.reset}\n`);
}

async function runCliCommand() {
  const [, , cmd, ...rest] = process.argv;

  if (cmd === 'serve') {
    await import('../server.mjs');
    return;
  }

  if (cmd === 'desktop') {
    const electronBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    spawn(electronBin, ['electron', '.'], { cwd: ROOT_DIR, stdio: 'inherit', shell: true });
    return;
  }

  if (cmd === 'rea' && rest[0]) {
    const out = await executeReaTool('rea_rebuild_blueprint', { targetPath: rest[0] });
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (cmd === 'mcp') {
    const tools = await listMcpTools();
    console.log(JSON.stringify(tools.map((t) => ({ server: t.serverId, tool: t.name, description: t.description })), null, 2));
    return;
  }

  // Interactive REPL
  banner();
  const st = await getState();
  let user = st.users[0] || (await ensureAdminUser(st.settings.adminEmail));
  let currentModel = st.models[0];
  let computerEnabled = true;
  const history = [];

  const showStatus = () => {
    const s = sanitizeUser(user);
    console.log(
      `${C.dim}  User: ${C.white}${s.email}${C.dim} · Plan: ${C.red}${s.plan.toUpperCase()}${C.dim} · Free Today: ${C.white}${s.freeUsedToday.toLocaleString()}/${s.freeLimitDaily.toLocaleString()}${C.dim} · Cap: ${C.white}$${s.currentCycleSpendUsd.toFixed(2)}/$${s.spendCapUsd.toFixed(2)}${C.dim} · Credits: ${C.white}$${s.creditBalanceUsd.toFixed(2)}${C.reset}`
    );
    console.log(`${C.dim}  Active Model: ${C.red}${currentModel.slug}${C.dim} (${currentModel.tier.toUpperCase()}) · Computer Control: ${computerEnabled ? C.white + 'ON' : C.dim + 'OFF'}${C.reset}\n`);
  };
  showStatus();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${C.red}abli${C.white}>${C.reset} `
  });

  rl.prompt();

  rl.on('line', async (rawLine) => {
    const line = rawLine.trim();
    if (!line) return rl.prompt();

    try {
      if (line === '/exit' || line === '/quit') {
        rl.close();
        process.exit(0);
      }

      if (line === '/usage') {
        showStatus();
        return rl.prompt();
      }

      if (line === '/models') {
        for (const m of st.models) {
          console.log(`  ${C.red}${m.slug.padEnd(28)}${C.white} [${m.tier.toUpperCase()}] ${C.dim}${m.platform} -> ${m.upstreamModelId}${C.reset}`);
        }
        console.log('');
        return rl.prompt();
      }

      if (line.startsWith('/model ')) {
        const slug = line.slice(7).trim();
        const found = st.models.find((m) => m.slug === slug);
        if (!found) console.log(`${C.red}  Model not found: ${slug}${C.reset}`);
        else {
          currentModel = found;
          console.log(`${C.white}  Switched to ${found.name} (${found.tier})${C.reset}`);
        }
        return rl.prompt();
      }

      if (line.startsWith('/rea ')) {
        const target = line.slice(5).trim();
        console.log(`${C.dim}  Running Stock REA MCP blueprint on ${target}...${C.reset}`);
        const out = await executeReaTool('rea_rebuild_blueprint', { targetPath: target });
        console.log(JSON.stringify(out, null, 2));
        return rl.prompt();
      }

      if (line === '/mcp') {
        const servers = await loadMcpServers();
        const tools = await listMcpTools();
        console.log(`${C.white}  Mounted MCP Servers (${servers.length}):${C.reset}`);
        for (const s of servers) console.log(`    - ${C.red}${s.id}${C.reset}: ${s.name}`);
        console.log(`${C.white}  Available MCP Tools (${tools.length}):${C.reset}`);
        for (const t of tools) console.log(`    • ${C.red}${t.name}${C.reset} ${C.dim}(${t.serverId})${C.reset}`);
        return rl.prompt();
      }

      if (line.startsWith('/mcp call ')) {
        const [, , , serverId, toolName, ...argParts] = line.split(/\s+/);
        const args = argParts.length ? JSON.parse(argParts.join(' ')) : {};
        const res = await invokeMcpTool(serverId, toolName, args);
        console.log(JSON.stringify(res, null, 2));
        return rl.prompt();
      }

      if (line.startsWith('/run ')) {
        const shellCmd = line.slice(5);
        const res = await executeComputerTool('computer_run_shell', { command: shellCmd });
        if (res.stdout) process.stdout.write(res.stdout);
        if (res.stderr) process.stderr.write(`${C.red}${res.stderr}${C.reset}`);
        return rl.prompt();
      }

      if (line === '/windows') {
        const res = await executeComputerTool('computer_list_windows', {});
        console.log(JSON.stringify(res, null, 2));
        return rl.prompt();
      }

      if (line === '/shot') {
        const res = await executeComputerTool('computer_screenshot', {});
        console.log(`${C.white}  Screenshot saved -> ${res.path} (${res.bytes} bytes)${C.reset}`);
        return rl.prompt();
      }

      // Chat prompt with quota gate + MCP tools
      const gate = checkQuota(user, currentModel);
      if (!gate.allowed) {
        console.log(`${C.red}  [STOPPED] ${gate.message}${C.reset}`);
        return rl.prompt();
      }

      history.push({ role: 'user', content: line });
      const res = await runChatCompletion({
        model: currentModel,
        messages: history.slice(-12),
        enableTools: true,
        computerControlEnabled: computerEnabled
      });
      history.push({ role: 'assistant', content: res.content });
      await recordUsage(user.id, currentModel, res.promptTokens, res.completionTokens);

      if (res.toolTrace?.length) {
        for (const t of res.toolTrace) {
          console.log(`${C.dim}  [MCP ${t.tool}] -> executed${C.reset}`);
        }
      }
      console.log(`\n${C.white}${res.content}${C.reset}\n`);
    } catch (err) {
      console.log(`${C.red}  Error: ${err.message}${C.reset}`);
    }
    rl.prompt();
  });
}

runCliCommand();
