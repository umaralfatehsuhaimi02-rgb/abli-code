import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');
const PUBLIC = path.join(ROOT, 'public');

await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(ASSETS, { recursive: true });

// Copy public/ files into dist/
try {
  const pubFiles = await fs.readdir(PUBLIC);
  for (const file of pubFiles) {
    await fs.copyFile(path.join(PUBLIC, file), path.join(DIST, file));
  }
} catch {}

// Bundle React + TypeScript + CSS via esbuild
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'esm',
  jsx: 'automatic',
  target: ['es2022', 'chrome120'],
  outdir: ASSETS,
  entryNames: 'index',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  write: false
});

let jsName = '';
let cssName = '';

for (const out of result.outputFiles) {
  const ext = path.extname(out.path);
  const hash = crypto.createHash('sha256').update(out.contents).digest('hex').slice(0, 8);
  const filename = `index-${hash}${ext}`;
  await fs.writeFile(path.join(ASSETS, filename), out.contents);
  if (ext === '.js') jsName = filename;
  if (ext === '.css') cssName = filename;
}

let html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(
  /<script\s+type="module"\s+src="\/src\/main\.tsx"><\/script>/,
  `${cssName ? `<link rel="stylesheet" href="./assets/${cssName}" />\n    ` : ''}<script type="module" src="./assets/${jsName}"></script>`
);
await fs.writeFile(path.join(DIST, 'index.html'), html, 'utf8');

console.log(`Built Abli Code dist/ -> ${jsName}, ${cssName}`);
