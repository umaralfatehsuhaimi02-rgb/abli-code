#!/usr/bin/env node
/**
 * Abli Code - Stock REA (Reverse Engineer Anything) MCP Server
 * Dual-mode:
 *   1) Standard MCP stdio JSON-RPC 2.0 server (`node mcp/rea-server.mjs`)
 *   2) Direct library export (`REA_TOOLS`, `executeReaTool`) for Abli Code Server, Desktop & Terminal
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

export const REA_TOOLS = [
  {
    name: 'rea_inspect_binary',
    description: 'Inspect a binary or archive (PE/EXE/DLL, ELF, Mach-O, WASM, ASAR, ZIP): detects format, CPU architecture, PE sections, Shannon entropy (packing detection), and file hashes.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute or relative path to the target binary or file' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'rea_extract_strings',
    description: 'Extract ASCII and UTF-16LE strings from a binary or compiled asset and categorize URLs, API routes, IPC channels, env vars, and interesting symbols.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to binary or file' },
        minLength: { type: 'number', description: 'Minimum string length (default 5)' },
        filter: { type: 'string', description: 'Optional regex/substring filter' },
        limit: { type: 'number', description: 'Max categorized matches per bucket (default 60)' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'rea_disassemble',
    description: 'Disassemble native binaries (via objdump/llvm-objdump/dumpbin when available, or clean hex+ASCII dump) or inspect/debundle JS, Python, and WASM sources.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to binary or script' },
        maxLines: { type: 'number', description: 'Maximum output lines (default 140)' },
        offset: { type: 'number', description: 'Byte offset for hex/disassembly window (default 0)' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'rea_analyze_codebase',
    description: 'Scan a folder or extracted app to map languages, entrypoints, dependencies, API endpoints, IPC bridges, and environment variables.',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: { type: 'string', description: 'Directory to analyze' },
        maxFiles: { type: 'number', description: 'Maximum files to scan (default 350)' }
      },
      required: ['targetDir']
    }
  },
  {
    name: 'rea_rebuild_blueprint',
    description: 'Generate a clean-room architecture and rebuild specification from an analyzed target file or directory.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: { type: 'string', description: 'Target file or directory to reverse-engineer into a rebuild spec' },
        goal: { type: 'string', description: 'Optional rebuild target stack (e.g., Rust CLI, TypeScript Electron app, Python service)' }
      },
      required: ['targetPath']
    }
  }
];

function shannonEntropy(buf) {
  if (!buf.length) return 0;
  const counts = new Uint32Array(256);
  for (let i = 0; i < buf.length; i++) counts[buf[i]]++;
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (!counts[i]) continue;
    const p = counts[i] / buf.length;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(4));
}

function parsePEHeaders(buf) {
  if (buf.length < 0x40 || buf[0] !== 0x4d || buf[1] !== 0x5a) return null;
  const peOffset = buf.readUInt32LE(0x3c);
  if (peOffset + 24 > buf.length) return null;
  if (buf.toString('ascii', peOffset, peOffset + 4) !== 'PE\x00\x00') return null;

  const machine = buf.readUInt16LE(peOffset + 4);
  const numberOfSections = buf.readUInt16LE(peOffset + 6);
  const timeDateStamp = buf.readUInt32LE(peOffset + 8);
  const sizeOfOptionalHeader = buf.readUInt16LE(peOffset + 20);
  const optOffset = peOffset + 24;
  const magic = optOffset + 2 <= buf.length ? buf.readUInt16LE(optOffset) : 0;

  const machineMap = {
    0x014c: 'x86 (i386)',
    0x8664: 'x86_64 (AMD64)',
    0xaa64: 'ARM64',
    0x01c4: 'ARM Thumb-2'
  };

  const sectionTableOffset = optOffset + sizeOfOptionalHeader;
  const sections = [];
  for (let i = 0; i < Math.min(numberOfSections, 32); i++) {
    const off = sectionTableOffset + i * 40;
    if (off + 40 > buf.length) break;
    const name = buf.toString('ascii', off, off + 8).replace(/\0+$/, '');
    const virtualSize = buf.readUInt32LE(off + 8);
    const virtualAddress = buf.readUInt32LE(off + 12);
    const rawSize = buf.readUInt32LE(off + 16);
    const rawPtr = buf.readUInt32LE(off + 20);
    const slice = rawPtr > 0 && rawSize > 0 && rawPtr + rawSize <= buf.length
      ? buf.subarray(rawPtr, rawPtr + Math.min(rawSize, 262144))
      : Buffer.alloc(0);
    sections.push({
      name,
      virtualSize,
      virtualAddress: '0x' + virtualAddress.toString(16),
      rawSize,
      entropy: slice.length ? shannonEntropy(slice) : 0
    });
  }

  return {
    format: magic === 0x20b ? 'PE32+ (64-bit)' : magic === 0x10b ? 'PE32 (32-bit)' : 'PE',
    architecture: machineMap[machine] || `0x${machine.toString(16)}`,
    compiledAt: new Date(timeDateStamp * 1000).toISOString(),
    sections
  };
}

function detectFormat(buf, ext) {
  if (buf.length >= 4) {
    if (buf[0] === 0x4d && buf[1] === 0x5a) return 'Windows PE / MZ';
    if (buf[0] === 0x7f && buf.toString('ascii', 1, 4) === 'ELF') return 'Linux ELF';
    if (buf[0] === 0x00 && buf.toString('ascii', 1, 4) === 'asm') return 'WebAssembly (WASM)';
    if (buf[0] === 0x50 && buf[1] === 0x4b) return 'ZIP / JAR / APK / OOXML Archive';
    const m32 = buf.readUInt32BE(0);
    if ([0xfeedface, 0xfeedfacf, 0xcafebabe, 0xcffaedfe, 0xcefaedfe].includes(m32)) return 'Mach-O';
  }
  return `File (${ext || 'unknown'})`;
}

async function inspectBinary({ filePath }) {
  const abs = path.resolve(filePath);
  const stat = await fs.stat(abs);
  const fh = await fs.open(abs, 'r');
  try {
    const sampleSize = Math.min(stat.size, 2 * 1024 * 1024);
    const buf = Buffer.alloc(sampleSize);
    await fh.read(buf, 0, sampleSize, 0);
    const entropy = shannonEntropy(buf);
    const pe = parsePEHeaders(buf);
    const format = detectFormat(buf, path.extname(abs));
    return {
      path: abs,
      sizeBytes: stat.size,
      format,
      overallEntropy: entropy,
      likelyPackedOrEncrypted: entropy > 7.2,
      pe,
      magicHex: buf.subarray(0, 16).toString('hex').match(/../g)?.join(' ') || ''
    };
  } finally {
    await fh.close();
  }
}

async function extractStrings({ filePath, minLength = 5, filter = '', limit = 60 }) {
  const abs = path.resolve(filePath);
  const stat = await fs.stat(abs);
  const maxRead = Math.min(stat.size, 8 * 1024 * 1024);
  const fh = await fs.open(abs, 'r');
  let buf;
  try {
    buf = Buffer.alloc(maxRead);
    await fh.read(buf, 0, maxRead, 0);
  } finally {
    await fh.close();
  }

  const ascii = [];
  let cur = '';
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (c >= 32 && c <= 126) {
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= minLength) ascii.push(cur);
      cur = '';
    }
  }
  if (cur.length >= minLength) ascii.push(cur);

  // UTF-16LE quick pass
  const utf16 = [];
  let ucur = '';
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const c = buf[i];
    const hi = buf[i + 1];
    if (hi === 0 && c >= 32 && c <= 126) {
      ucur += String.fromCharCode(c);
    } else {
      if (ucur.length >= minLength) utf16.push(ucur);
      ucur = '';
    }
  }
  if (ucur.length >= minLength) utf16.push(ucur);

  const unique = Array.from(new Set([...ascii, ...utf16]));
  const filtered = filter
    ? unique.filter((s) => s.toLowerCase().includes(filter.toLowerCase()))
    : unique;

  const urls = filtered.filter((s) => /https?:\/\/|wss?:\/\//i.test(s)).slice(0, limit);
  const routes = filtered.filter((s) => /^\/[a-z0-9_\-/{}:.]{2,}$/i.test(s) || /\/api\/|\/v1\//i.test(s)).slice(0, limit);
  const envOrKeys = filtered.filter((s) => /^[A-Z][A-Z0-9_]{4,}$/.test(s)).slice(0, limit);
  const interesting = filtered.filter((s) => /(token|auth|license|crypt|aes|hmac|ipc|electron|supabase|stripe|sqlite|eval|spawn)/i.test(s)).slice(0, limit);

  return {
    path: abs,
    scannedBytes: maxRead,
    totalUniqueStrings: unique.length,
    buckets: {
      urls,
      routes,
      envOrConstants: envOrKeys,
      securityAndIpcHints: interesting
    },
    sample: filtered.slice(0, limit)
  };
}

async function disassemble({ filePath, maxLines = 140, offset = 0 }) {
  const abs = path.resolve(filePath);
  const ext = path.extname(abs).toLowerCase();

  if (['.js', '.mjs', '.cjs', '.ts', '.tsx', '.py', '.json', '.rs', '.go', '.c', '.cpp', '.h'].includes(ext)) {
    const text = await fs.readFile(abs, 'utf8');
    const lines = text.split(/\r?\n/);
    return {
      mode: 'source-inspect',
      path: abs,
      totalLines: lines.length,
      preview: lines.slice(0, maxLines).join('\n')
    };
  }

  // Try native disassemblers if available on the machine
  for (const [cmd, args] of [
    ['llvm-objdump', ['-d', '--no-show-raw-insn', abs]],
    ['objdump', ['-d', '-M', 'intel', abs]]
  ]) {
    try {
      const { stdout } = await execFileAsync(cmd, args, { timeout: 10000, maxBuffer: 4 * 1024 * 1024 });
      const lines = stdout.split(/\r?\n/).slice(0, maxLines);
      return { mode: cmd, path: abs, output: lines.join('\n') };
    } catch {
      // try next tool
    }
  }

  // Clean hex + ASCII window fallback
  const fh = await fs.open(abs, 'r');
  try {
    const winSize = Math.min(maxLines * 16, 4096);
    const buf = Buffer.alloc(winSize);
    const { bytesRead } = await fh.read(buf, 0, winSize, offset);
    const rows = [];
    for (let i = 0; i < bytesRead; i += 16) {
      const chunk = buf.subarray(i, Math.min(i + 16, bytesRead));
      const hex = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
      const asc = Array.from(chunk).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      rows.push(`${(offset + i).toString(16).padStart(8, '0')}  ${hex}  |${asc}|`);
    }
    return { mode: 'hex-dump', path: abs, offset, bytesRead, output: rows.join('\n') };
  } finally {
    await fh.close();
  }
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'target', 'release', '.next', '__pycache__', '.venv']);

async function analyzeCodebase({ targetDir, maxFiles = 350 }) {
  const root = path.resolve(targetDir);
  const files = [];
  const extCounts = {};
  const entrypoints = [];
  const apiRoutes = [];
  const ipcChannels = [];

  async function walk(dir) {
    if (files.length >= maxFiles) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (files.length >= maxFiles) break;
      if (SKIP_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else {
        const rel = path.relative(root, full);
        const ext = path.extname(ent.name).toLowerCase() || '(none)';
        extCounts[ext] = (extCounts[ext] || 0) + 1;
        files.push(rel);

        if (/^(main|index|server|app|lib)\.(mjs|js|ts|tsx|py|rs|go)$/i.test(ent.name) || ent.name === 'package.json' || ent.name === 'Cargo.toml') {
          entrypoints.push(rel);
        }

        if (['.js', '.mjs', '.ts', '.tsx', '.py', '.rs', '.go'].includes(ext)) {
          try {
            const content = await fs.readFile(full, 'utf8');
            if (content.length < 300000) {
              const routeMatches = content.match(/['"`]\/api\/[a-zA-Z0-9_\-/:]+['"`]/g) || [];
              for (const m of routeMatches) apiRoutes.push(`${rel}: ${m}`);
              const ipcMatches = content.match(/ipcMain\.handle\(['"`][^'"`]+['"`]/g) || [];
              for (const m of ipcMatches) ipcChannels.push(`${rel}: ${m}`);
            }
          } catch {
            // ignore read errors
          }
        }
      }
    }
  }

  await walk(root);

  return {
    root,
    scannedFiles: files.length,
    languagesByExtension: extCounts,
    entrypoints: entrypoints.slice(0, 40),
    apiRoutes: Array.from(new Set(apiRoutes)).slice(0, 50),
    ipcChannels: Array.from(new Set(ipcChannels)).slice(0, 50),
    fileSample: files.slice(0, 80)
  };
}

async function rebuildBlueprint({ targetPath, goal = 'Clean-room modular TypeScript/Rust rebuild' }) {
  const abs = path.resolve(targetPath);
  const stat = await fs.stat(abs);
  if (stat.isDirectory()) {
    const analysis = await analyzeCodebase({ targetDir: abs });
    return {
      target: abs,
      kind: 'directory',
      rebuildGoal: goal,
      detectedSurface: {
        languages: analysis.languagesByExtension,
        entrypoints: analysis.entrypoints,
        apiRoutes: analysis.apiRoutes,
        ipcChannels: analysis.ipcChannels
      },
      cleanRoomSteps: [
        '1. Lock external contracts: freeze discovered API routes, CLI flags, and IPC schemas.',
        '2. Replace runtime/transport layer cleanly using open-source interfaces.',
        '3. Re-implement core state & business logic from observed I/O behavior without copying proprietary code.',
        '4. Add automated contract tests verifying parity against captured fixtures.'
      ]
    };
  }
  const bin = await inspectBinary({ filePath: abs });
  const str = await extractStrings({ filePath: abs, limit: 25 });
  return {
    target: abs,
    kind: 'binary',
    rebuildGoal: goal,
    binaryProfile: bin,
    discoveredEndpoints: str.buckets.routes,
    discoveredUrls: str.buckets.urls,
    securityHints: str.buckets.securityAndIpcHints,
    cleanRoomSteps: [
      `1. Target format detected: ${bin.format} (entropy ${bin.overallEntropy}).`,
      bin.likelyPackedOrEncrypted
        ? '2. High entropy detected (>7.2): unpack or dump memory regions before static recovery.'
        : '2. Unpacked static sections: map imports, API routes, and IPC strings directly.',
      '3. Reconstruct data models and protocol handlers in clean-room source code.',
      '4. Validate behavior against test harness and ship open-source replacement.'
    ]
  };
}

export async function executeReaTool(name, args = {}) {
  switch (name) {
    case 'rea_inspect_binary':
      return inspectBinary(args);
    case 'rea_extract_strings':
      return extractStrings(args);
    case 'rea_disassemble':
      return disassemble(args);
    case 'rea_analyze_codebase':
      return analyzeCodebase(args);
    case 'rea_rebuild_blueprint':
      return rebuildBlueprint(args);
    default:
      throw new Error(`Unknown REA tool: ${name}`);
  }
}

// Run as MCP stdio server when executed directly
const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const send = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }

    const { id, method, params } = msg;
    try {
      if (method === 'initialize') {
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'abli-rea-mcp', version: '1.0.0' },
            capabilities: { tools: {} }
          }
        });
      }
      if (method === 'notifications/initialized') return;
      if (method === 'tools/list') {
        return send({ jsonrpc: '2.0', id, result: { tools: REA_TOOLS } });
      }
      if (method === 'tools/call') {
        const result = await executeReaTool(params?.name, params?.arguments || {});
        return send({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        });
      }
      if (id !== undefined) {
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    } catch (err) {
      if (id !== undefined) {
        send({ jsonrpc: '2.0', id, error: { code: -32000, message: String(err?.message || err) } });
      }
    }
  });
}
