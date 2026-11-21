import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const COMPUTER_TOOLS = [
  {
    name: 'computer_run_shell',
    description: 'Execute a PowerShell/shell command on the local computer and return stdout, stderr, and exit code.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
        timeoutMs: { type: 'number', description: 'Timeout in ms (default 20000)' }
      },
      required: ['command']
    }
  },
  {
    name: 'computer_read_file',
    description: 'Read a text file from disk.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        maxBytes: { type: 'number' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'computer_write_file',
    description: 'Write or overwrite a file on disk (creates parent directories automatically).',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'computer_list_dir',
    description: 'List files and subdirectories in a local directory.',
    inputSchema: {
      type: 'object',
      properties: {
        dirPath: { type: 'string' }
      },
      required: ['dirPath']
    }
  },
  {
    name: 'computer_list_windows',
    description: 'List visible desktop application windows and running processes.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'computer_screenshot',
    description: 'Capture a primary screen PNG snapshot and return its file path and base64 preview.',
    inputSchema: {
      type: 'object',
      properties: {
        outputPath: { type: 'string', description: 'Optional path to save screenshot PNG' }
      }
    }
  },
  {
    name: 'computer_mouse_click',
    description: 'Move the cursor to (x, y) and perform a left or right mouse click.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        button: { type: 'string', enum: ['left', 'right'] }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'computer_type_text',
    description: 'Send keystrokes/text to the active desktop window.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    }
  }
];

function runPs(script, timeout = 20000) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return execAsync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
    timeout,
    maxBuffer: 4 * 1024 * 1024
  });
}

export async function executeComputerTool(name, args = {}) {
  switch (name) {
    case 'computer_run_shell': {
      const { command, cwd, timeoutMs = 20000 } = args;
      try {
        const isWin = process.platform === 'win32';
        const { stdout, stderr } = await execAsync(command, {
          cwd: cwd ? path.resolve(cwd) : process.cwd(),
          timeout: Math.min(Number(timeoutMs) || 20000, 60000),
          maxBuffer: 4 * 1024 * 1024,
          shell: isWin ? 'powershell.exe' : '/bin/bash'
        });
        return { ok: true, exitCode: 0, stdout: stdout.slice(0, 24000), stderr: stderr.slice(0, 8000) };
      } catch (err) {
        return {
          ok: false,
          exitCode: err.code ?? 1,
          stdout: (err.stdout || '').slice(0, 12000),
          stderr: (err.stderr || err.message || '').slice(0, 8000)
        };
      }
    }

    case 'computer_read_file': {
      const abs = path.resolve(args.filePath);
      const data = await fs.readFile(abs, 'utf8');
      const limit = Number(args.maxBytes) || 64000;
      return { path: abs, truncated: data.length > limit, content: data.slice(0, limit) };
    }

    case 'computer_write_file': {
      const abs = path.resolve(args.filePath);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, String(args.content ?? ''), 'utf8');
      return { ok: true, path: abs, bytes: Buffer.byteLength(String(args.content ?? ''), 'utf8') };
    }

    case 'computer_list_dir': {
      const abs = path.resolve(args.dirPath || process.cwd());
      const entries = await fs.readdir(abs, { withFileTypes: true });
      return {
        path: abs,
        entries: entries.slice(0, 200).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file'
        }))
      };
    }

    case 'computer_list_windows': {
      if (process.platform !== 'win32') {
        return { platform: process.platform, windows: [], note: 'Window enumeration optimized for Windows; use computer_run_shell on macOS/Linux.' };
      }
      const { stdout } = await runPs(
        `Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json -Compress`
      );
      const parsed = stdout.trim() ? JSON.parse(stdout) : [];
      return { platform: 'win32', windows: Array.isArray(parsed) ? parsed : [parsed] };
    }

    case 'computer_screenshot': {
      if (process.platform !== 'win32') {
        return { ok: false, error: 'Built-in screenshot hook requires Windows (.NET System.Drawing) or external tool.' };
      }
      const out = args.outputPath
        ? path.resolve(args.outputPath)
        : path.join(os.tmpdir(), `abli-shot-${Date.now()}.png`);
      await fs.mkdir(path.dirname(out), { recursive: true });
      const ps = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save('${out.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
`;
      await runPs(ps);
      const buf = await fs.readFile(out);
      return {
        ok: true,
        path: out,
        bytes: buf.length,
        dataUrl: `data:image/png;base64,${buf.toString('base64')}`
      };
    }

    case 'computer_mouse_click': {
      if (process.platform !== 'win32') {
        return { ok: false, error: 'Mouse click automation requires Windows Win32 user32.dll.' };
      }
      const x = Math.round(Number(args.x) || 0);
      const y = Math.round(Number(args.y) || 0);
      const right = args.button === 'right';
      const downFlag = right ? '0x0008' : '0x0002';
      const upFlag = right ? '0x0010' : '0x0004';
      const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AbliMouse {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
}
"@
[AbliMouse]::SetCursorPos(${x}, ${y}) | Out-Null
[AbliMouse]::mouse_event(${downFlag}, 0, 0, 0, 0)
[AbliMouse]::mouse_event(${upFlag}, 0, 0, 0, 0)
`;
      await runPs(ps);
      return { ok: true, clicked: { x, y, button: right ? 'right' : 'left' } };
    }

    case 'computer_type_text': {
      if (process.platform !== 'win32') {
        return { ok: false, error: 'SendKeys requires Windows.' };
      }
      const safe = String(args.text || '').replace(/'/g, "''");
      const ps = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${safe}')
`;
      await runPs(ps);
      return { ok: true, typedLength: safe.length };
    }

    default:
      throw new Error(`Unknown computer tool: ${name}`);
  }
}
