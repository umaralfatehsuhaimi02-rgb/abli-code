// Turn code blocks from a reply into real files and folders (.zip), in the browser. Nothing is installed.

const EXT: Record<string, string> = {
  python: 'py', py: 'py', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', tsx: 'tsx', jsx: 'jsx', json: 'json',
  html: 'html', css: 'css', bash: 'sh', sh: 'sh', shell: 'sh', powershell: 'ps1', ps1: 'ps1', bat: 'bat', cmd: 'bat',
  c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', cs: 'cs', java: 'java', go: 'go', rust: 'rs', rs: 'rs', ruby: 'rb',
  php: 'php', sql: 'sql', yaml: 'yml', yml: 'yml', toml: 'toml', markdown: 'md', md: 'md', xml: 'xml', txt: 'txt', text: 'txt',
  lua: 'lua', kotlin: 'kt', swift: 'swift', dockerfile: 'Dockerfile', makefile: 'Makefile'
};

export interface FenceInfo {
  lang: string;
  path: string; // empty when the reply did not name a file
}

function cleanPath(p: string): string {
  const parts = p.replace(/\\/g, '/').replace(/^[a-zA-Z]:/, '').split('/').filter((x) => x && x !== '.' && x !== '..');
  return parts.join('/');
}

export function parseFence(info: string, code: string): FenceInfo {
  const raw = (info || '').trim();
  const tokens = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const lang = (tokens[0] || '').replace(/[{}]/g, '').toLowerCase();
  let path = '';
  for (const t of tokens.slice(1)) {
    const m = /^(?:path|title|file|filename|name)=["']?([^"']+)["']?$/i.exec(t);
    if (m) { path = m[1]; break; }
    if (/^[\w@.\-\/\\]+\.[A-Za-z0-9]{1,8}$/.test(t.replace(/["']/g, '')) || /^[\w.\-]+\/[\w.\-\/]+$/.test(t)) { path = t.replace(/["']/g, ''); break; }
  }
  if (!path && tokens.length === 1 && /[\/.]/.test(tokens[0]) && /\.[A-Za-z0-9]{1,8}$/.test(tokens[0])) path = tokens[0];
  if (!path) {
    const first = (code.split('\n')[0] || '').trim();
    const m = /^(?:#|\/\/|--|<!--|\/\*)\s*(?:file(?:name)?|path)\s*:\s*([\w@.\-\/\\]+\.[A-Za-z0-9]{1,8})/i.exec(first);
    if (m) path = m[1];
  }
  return { lang: tokens.length && path && lang === path.toLowerCase() ? '' : lang, path: cleanPath(path) };
}

export function defaultName(lang: string): string {
  const ext = EXT[lang] || 'txt';
  return ext === 'Dockerfile' || ext === 'Makefile' ? ext : 'snippet.' + ext;
}

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function makeZip(files: { path: string; content: string }[]): Blob {
  const enc = new TextEncoder();
  const parts: any[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const name = enc.encode(f.path);
    const data = enc.encode(f.content);
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    const entry = new Uint8Array(46 + name.length);
    entry.set(new Uint8Array(ch.buffer), 0); entry.set(name, 46);
    central.push(entry);
    offset += 30 + name.length + data.length;
  }
  let cdSize = 0;
  for (const c of central) { parts.push(c); cdSize += c.length; }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  parts.push(new Uint8Array(end.buffer));
  return new Blob(parts, { type: 'application/zip' });
}

export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function saveText(name: string, text: string) {
  saveBlob(name.split('/').pop() || name, new Blob([text], { type: 'text/plain;charset=utf-8' }));
}

const BUILD_BAT = [
  '@echo off',
  'rem Builds a single .exe from this folder. Needs Python from python.org.',
  'set MAIN=%1',
  'if "%MAIN%"=="" set MAIN=__MAIN__',
  'python -m pip install --quiet pyinstaller',
  'python -m PyInstaller --onefile --noconfirm "%MAIN%"',
  'echo.',
  'echo Done. Your program is in the dist folder.',
  'pause',
  ''
].join('\r\n');

// Zip the named files from a reply into one folder. Python projects get a one-click build-exe.bat.
export function downloadProject(files: { path: string; content: string }[]) {
  const seen = new Set<string>();
  const list = files.filter((f) => f.path && !seen.has(f.path) && seen.add(f.path));
  const tops = new Set(list.map((f) => f.path.split('/')[0]));
  const root = list.every((f) => f.path.includes('/')) && tops.size === 1 ? '' : 'abli-project/';
  const py = list.find((f) => /(^|\/)(main|app|run|__main__)\.py$/.test(f.path)) || list.find((f) => f.path.endsWith('.py'));
  const out = list.map((f) => ({ path: root + f.path, content: f.content }));
  if (py && !list.some((f) => f.path.endsWith('build-exe.bat'))) {
    const rel = (root ? py.path : py.path.split('/').slice(1).join('/') || py.path);
    out.push({ path: root + (root ? '' : py.path.split('/')[0] + '/') + 'build-exe.bat', content: BUILD_BAT.replace('__MAIN__', rel.replace(/\//g, '\\')) });
  }
  const name = (root ? 'abli-project' : [...tops][0]) + '.zip';
  saveBlob(name, makeZip(out));
}
