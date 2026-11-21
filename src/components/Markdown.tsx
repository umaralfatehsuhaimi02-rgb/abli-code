import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { parseFence, defaultName, saveText, downloadProject } from '../lib/files';

const RED = '#ff2a43';

const codeStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 12.5,
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 6,
  padding: '1px 6px'
};

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = keyBase + '-' + i++;
    if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key} style={codeStyle}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\((.+)\)$/.exec(tok);
      if (mm) out.push(<a key={key} href={mm[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#ff8a97' }}>{mm[1]}</a>);
      else out.push(tok);
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const fi = parseFence(lang, code);
  return (
    <div style={{ background: '#08080c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', margin: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 6px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#8e8e9c' }}>
        <span style={{ letterSpacing: '0.04em' }}>{fi.path ? fi.path : fi.lang || 'code'}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => saveText(fi.path || defaultName(fi.lang), code)}
          style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'inherit' }}
        >
          <Download size={12} /> Save
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          style={{ background: 'none', border: 'none', color: copied ? RED : '#8e8e9c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'inherit' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
        </span>
      </div>
      <pre style={{ margin: 0, padding: '12px 14px', overflowX: 'auto', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12.5, lineHeight: 1.6, color: '#e4e4ec' }}>{code}</pre>
    </div>
  );
}

export function Markdown({ text }: { text: string }) {
  const lines = (text || '').split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  const projectFiles: { path: string; content: string }[] = [];
  let i = 0;
  let n = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = 'b' + n++;

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      const body = buf.join(String.fromCharCode(10));
      const fi = parseFence(lang, body);
      if (fi.path) projectFiles.push({ path: fi.path, content: body });
      blocks.push(<CodeBlock key={key} code={body} lang={lang} />);
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1].length === 1 ? 20 : h[1].length === 2 ? 17 : 15;
      blocks.push(<div key={key} style={{ fontSize: size, fontWeight: 700, margin: '14px 0 6px', letterSpacing: '-0.01em' }}>{inline(h[2], key)}</div>);
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<div key={key} style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />);
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      blocks.push(
        <ul key={key} style={{ margin: '6px 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
          {items.map((it, j) => (
            <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ width: 6, height: 6, background: RED, borderRadius: 1, flexShrink: 0, transform: 'translateY(-1px)' }} />
              <span style={{ minWidth: 0 }}>{inline(it, key + '-' + j)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push(
        <ol key={key} style={{ margin: '6px 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
          {items.map((it, j) => (
            <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ color: RED, fontWeight: 700, fontSize: 12.5, minWidth: 18 }}>{j + 1}.</span>
              <span style={{ minWidth: 0 }}>{inline(it, key + '-' + j)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(
        <div key={key} style={{ borderLeft: '3px solid rgba(255,255,255,0.2)', paddingLeft: 12, color: '#b8b8c4', margin: '8px 0' }}>
          {inline(buf.join(' '), key)}
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i])
    ) para.push(lines[i++]);
    blocks.push(
      <p key={key} style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>
        {inline(para.join(String.fromCharCode(10)), key)}
      </p>
    );
  }
  if (projectFiles.length >= 2) {
    blocks.push(
      <button key="dl-project" className="btn-outline" onClick={() => downloadProject(projectFiles)} style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 7, margin: '4px 0 8px', cursor: 'pointer' }}>
        <Download size={14} /> Download folder ({projectFiles.length} files)
      </button>
    );
  }
  return <div>{blocks}</div>;
}
