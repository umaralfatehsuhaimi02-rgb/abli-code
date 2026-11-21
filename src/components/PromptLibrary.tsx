import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

interface SavedPrompt {
  id: string;
  title: string;
  text: string;
}

const KEY = 'abli_prompts_v1';
const RED = '#ff2a43';

const STARTERS: SavedPrompt[] = [
  { id: 'starter-explain', title: 'Explain this codebase', text: 'Walk me through this project: its structure, the main entry points, and how the pieces fit together.' },
  { id: 'starter-bugs', title: 'Find bugs', text: 'Review the code in this folder for bugs and risky edge cases. List each issue with the file and a suggested fix.' },
  { id: 'starter-tests', title: 'Write tests', text: 'Write focused unit tests for the most important functions in this folder. Explain what each test covers.' },
  { id: 'starter-refactor', title: 'Refactor safely', text: 'Suggest a refactor that makes this code simpler without changing its behavior. Show the diff.' },
  { id: 'starter-reverse', title: 'Reverse engineer a sample', text: 'Help me analyze this binary or sample step by step: identify its structure, key functions, and notable behavior.' }
];

function load(): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v;
    }
  } catch {}
  return STARTERS;
}

export function PromptLibrary({ open, onClose, onUse }: { open: boolean; onClose: () => void; onUse: (text: string) => void }) {
  const [items, setItems] = useState<SavedPrompt[]>(load);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => { setEditingId(null); setTitle(''); setText(''); };
  const save = () => {
    const t = title.trim();
    const body = text.trim();
    if (!t || !body) return;
    if (editingId) setItems((cur) => cur.map((p) => (p.id === editingId ? { ...p, title: t, text: body } : p)));
    else setItems((cur) => [{ id: crypto.randomUUID(), title: t, text: body }, ...cur]);
    reset();
  };

  const field: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: '#15151b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    color: '#fff', fontSize: 13, padding: '9px 11px', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: '94vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: '#0f0f14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 10px' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Prompts</div>
            <div style={{ fontSize: 12.5, color: '#8e8e9c', marginTop: 2 }}>Save the prompts you reuse and drop them into any thread.</div>
          </div>
          <button onClick={onClose} className="sb-icon-btn" title="Close"><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '6px 20px', display: 'grid', gap: 8 }}>
          {items.length === 0 && <div style={{ fontSize: 13, color: '#71717e', padding: '12px 0' }}>No saved prompts yet.</div>}
          {items.map((p) => (
            <div key={p.id} className="plan-card" style={{ background: '#14141b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <button className="sb-icon-btn" title="Edit" onClick={() => { setEditingId(p.id); setTitle(p.title); setText(p.text); }}><Pencil size={13} /></button>
                <button className="sb-icon-btn" title="Delete" onClick={() => setItems((cur) => cur.filter((x) => x.id !== p.id))}><Trash2 size={13} /></button>
                <button className="btn-red" style={{ padding: '5px 14px', fontSize: 12 }} onClick={() => { onUse(p.text); onClose(); }}>Use</button>
              </div>
              <div style={{ fontSize: 12.5, color: '#9b9ba8', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9b9ba8' }}>{editingId ? 'Edit prompt' : 'New prompt'}</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={field} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What should it say?" rows={3} style={{ ...field, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editingId && <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={reset}>Cancel</button>}
            <button className="btn-red" disabled={!title.trim() || !text.trim()} style={{ padding: '7px 16px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={save}>
              <Plus size={13} /> {editingId ? 'Save changes' : 'Add prompt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
