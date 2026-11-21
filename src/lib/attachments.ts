// Attachments for the chat composer: photos (downscaled in the browser) and text or code files (inlined into the prompt).

export interface Attachment {
  id: string;
  name: string;
  kind: 'image' | 'text';
  mime: string;
  size: number;
  dataUrl?: string;
  text?: string;
  truncated?: boolean;
}

export const MAX_IMAGES = 4;
export const MAX_FILES = 6;
const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_BYTES = 150 * 1024;
const IMAGE_EDGE = 1280;

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'jsonl', 'csv', 'tsv', 'log', 'yaml', 'yml', 'toml', 'ini', 'env', 'xml', 'html', 'htm', 'css', 'scss',
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'c', 'h', 'cpp', 'hpp', 'cs', 'php', 'swift', 'sh',
  'ps1', 'bat', 'sql', 'lua', 'r', 'dart', 'gradle', 'cfg', 'conf', 'asm', 's', 'diff', 'patch', 'gitignore', 'dockerfile'
]);

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : name.toLowerCase();
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error || new Error('Could not read the file'));
    r.readAsDataURL(file);
  });
}

async function downscaleImage(file: File): Promise<string> {
  const url = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not open ' + file.name + ' as an image'));
    i.src = url;
  });
  const scale = Math.min(1, IMAGE_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process ' + file.name);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function looksLikeText(file: File): boolean {
  if (file.type.startsWith('text/')) return true;
  if (file.type === 'application/json' || file.type === 'application/xml' || file.type === 'application/javascript') return true;
  return TEXT_EXTENSIONS.has(extOf(file.name));
}

export async function readFiles(files: File[], current: Attachment[]): Promise<{ added: Attachment[]; errors: string[] }> {
  const added: Attachment[] = [];
  const errors: string[] = [];
  let images = current.filter((a) => a.kind === 'image').length;
  let texts = current.filter((a) => a.kind === 'text').length;

  for (const file of files) {
    try {
      if (file.type.startsWith('image/')) {
        if (images >= MAX_IMAGES) { errors.push('Up to ' + MAX_IMAGES + ' photos per message.'); continue; }
        if (file.size > MAX_RAW_IMAGE_BYTES) { errors.push(file.name + ' is over 15 MB.'); continue; }
        const dataUrl = await downscaleImage(file);
        images++;
        added.push({ id: crypto.randomUUID(), name: file.name || 'photo.jpg', kind: 'image', mime: 'image/jpeg', size: file.size, dataUrl });
      } else if (looksLikeText(file)) {
        if (texts >= MAX_FILES) { errors.push('Up to ' + MAX_FILES + ' files per message.'); continue; }
        const slice = file.size > MAX_TEXT_BYTES ? file.slice(0, MAX_TEXT_BYTES) : file;
        const text = await slice.text();
        if (text.indexOf(String.fromCharCode(0)) !== -1) { errors.push(file.name + ' looks like a binary file.'); continue; }
        texts++;
        added.push({ id: crypto.randomUUID(), name: file.name, kind: 'text', mime: file.type || 'text/plain', size: file.size, text, truncated: file.size > MAX_TEXT_BYTES });
      } else {
        errors.push(file.name + ': only photos and text or code files for now.');
      }
    } catch (e: any) {
      errors.push(e?.message || 'Could not read ' + file.name);
    }
  }
  return { added, errors };
}

// Turns a stored message into what the API receives: files are inlined as fenced text, photos become image parts.
export function toApiMessage(m: { role: string; content: string; attachments?: Attachment[] }, keepImages = true): any {
  const atts = m.attachments || [];
  if (!atts.length) return { role: m.role, content: m.content };
  const fence = String.fromCharCode(96).repeat(3);
  let text = m.content || '';
  for (const a of atts) {
    if (a.kind === 'image' && !keepImages) { text += '\n[Photo attached earlier: ' + a.name + ']'; continue; }
    if (a.kind !== 'text') continue;
    text += '\n\n[Attached file: ' + a.name + (a.truncated ? ' (truncated)' : '') + ']\n' + fence + '\n' + (a.text || '') + '\n' + fence;
  }
  const imgs = keepImages ? atts.filter((a) => a.kind === 'image' && a.dataUrl) : [];
  if (!imgs.length) return { role: m.role, content: text };
  return {
    role: m.role,
    content: [
      { type: 'text', text: text.trim() ? text : 'Describe this image.' },
      ...imgs.map((a) => ({ type: 'image_url', image_url: { url: a.dataUrl as string } }))
    ]
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
