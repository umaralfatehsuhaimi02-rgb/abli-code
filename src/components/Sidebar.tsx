import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, ChevronRight, CreditCard, Folder, FolderPlus, LogOut, Monitor, Pin, Plug, Plus, Search, Trash2, X
} from 'lucide-react';

export interface SidebarThread {
  id: string;
  title: string;
  workspacePath: string;
  modelSlug: string;
  updatedAt: string;
}

interface SidebarProps {
  threads: SidebarThread[];
  activeId: string;
  busyId?: string;
  modelName: (slug: string) => string;
  user: any;
  usage: { label: string; value: string; percent: number } | null;
  computerOpen: boolean;
  onSelect: (id: string) => void;
  onNew: (folder?: string) => void;
  onAddProject: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, title: string) => void;
  onOpenMcp: () => void;
  onToggleComputer: () => void;
  onOpenBilling: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

const RED = '#ff2a43';
const COLLAPSE_KEY = 'abli_sidebar_collapsed_v1';
const PIN_KEY = 'abli_sidebar_pinned_v1';
const VIEW_KEY = 'abli_sidebar_view_v1';

function baseName(p: string) {
  const parts = p.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] || p;
}

function rel(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!(s >= 60)) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 86400 * 7) return Math.floor(s / 86400) + 'd';
  return Math.floor(s / 604800) + 'w';
}

function loadCollapsed(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function NavRow({ icon, label, hint, active, onClick }: { icon: React.ReactNode; label: string; hint?: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      className={'sb-row' + (active ? ' sb-active' : '')}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 10,
        border: 'none',
        color: active ? '#fff' : '#d4d4de',
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit'
      }}
    >
      <span style={{ display: 'inline-flex', color: RED }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {hint && <span style={{ fontSize: 11, color: '#5f5f6b' }}>{hint}</span>}
    </button>
  );
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 10px 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: '#71717e' }}>
      <span>{label}</span>
      {action}
    </div>
  );
}

function ThreadRow({ t, active, busy, indent, tip, pinned, onSelect, onDelete, onPin, onRename }: {
  t: SidebarThread; active: boolean; busy: boolean; indent: boolean; tip: string; pinned: boolean;
  onSelect: (id: string) => void; onDelete: (id: string, e: React.MouseEvent) => void;
  onPin: (id: string) => void; onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(t.title);
  const commit = () => {
    const v = draft.trim();
    setEditing(false);
    if (v && v !== t.title) onRename(t.id, v);
  };
  return (
    <div
      className={'sb-row sb-thread' + (active ? ' sb-active' : '')}
      onClick={() => { if (!editing) onSelect(t.id); }}
      onDoubleClick={() => { setDraft(t.title); setEditing(true); }}
      title={tip + '  (double-click to rename)'}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 36px 7px ' + (indent ? 32 : 12) + 'px', borderRadius: 10, cursor: 'pointer' }}
    >
      {active && <span style={{ position: 'absolute', left: indent ? 20 : 3, top: 8, bottom: 8, width: 3, borderRadius: 3, background: RED }} />}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{ flex: 1, minWidth: 0, background: '#15151b', border: '1px solid ' + RED, borderRadius: 7, outline: 'none', color: '#fff', fontSize: 13, padding: '3px 6px', fontFamily: 'inherit' }}
        />
      ) : (
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: active ? '#fff' : '#b8b8c4', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.title}
        </span>
      )}
      {!editing && (busy ? (
        <span className="sb-dot" style={{ position: 'absolute', right: 12 }} />
      ) : (
        <span className="sb-time" style={{ position: 'absolute', right: 12, fontSize: 11, color: '#5f5f6b' }}>{rel(t.updatedAt)}</span>
      ))}
      {!editing && (
        <>
          <button className="sb-act sb-act2" title={pinned ? 'Unpin' : 'Pin to top'} onClick={(e) => { e.stopPropagation(); onPin(t.id); }} style={{ color: pinned ? RED : undefined }}>
            <Pin size={13} />
          </button>
          <button className="sb-act" title="Delete thread" onClick={(e) => onDelete(t.id, e)}>
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

export function Sidebar(p: SidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>(loadCollapsed);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [view, setView] = useState<'projects' | 'recents'>(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'recents' ? 'recents' : 'projects'; } catch { return 'projects'; }
  });
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(PIN_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  useEffect(() => { try { localStorage.setItem(PIN_KEY, JSON.stringify(pinned)); } catch {} }, [pinned]);
  const togglePin = (id: string) => setPinned((c) => (c.includes(id) ? c.filter((x) => x !== id) : [id, ...c]));

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const filtered = p.threads.filter((t) => !q || t.title.toLowerCase().includes(q) || baseName(t.workspacePath || '').toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const pins = pinned.map((id) => sorted.find((t) => t.id === id)).filter(Boolean) as SidebarThread[];
    const rest = sorted.filter((t) => !pinned.includes(t.id));
    const projects = new Map<string, SidebarThread[]>();
    const chats: SidebarThread[] = [];
    for (const t of rest) {
      if (t.workspacePath) {
        const arr = projects.get(t.workspacePath) || [];
        arr.push(t);
        projects.set(t.workspacePath, arr);
      } else {
        chats.push(t);
      }
    }
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const today = startOfDay(new Date());
    const buckets: [string, SidebarThread[]][] = [['Today', []], ['Yesterday', []], ['Previous 7 days', []], ['Older', []]];
    for (const t of rest) {
      const age = Math.round((today - startOfDay(new Date(t.updatedAt))) / 86400000);
      const i = age <= 0 ? 0 : age === 1 ? 1 : age <= 7 ? 2 : 3;
      buckets[i][1].push(t);
    }
    return { pins, projects: Array.from(projects.entries()), chats, buckets: buckets.filter((b) => b[1].length > 0), total: sorted.length };
  }, [p.threads, q, pinned]);

  const row = (t: SidebarThread, indent: boolean) => (
    <ThreadRow
      key={t.id}
      t={t}
      indent={indent}
      active={t.id === p.activeId}
      busy={t.id === p.busyId}
      pinned={pinned.includes(t.id)}
      tip={p.modelName(t.modelSlug)}
      onSelect={p.onSelect}
      onDelete={p.onDelete}
      onPin={togglePin}
      onRename={p.onRename}
    />
  );

  const toggle = (path: string) =>
    setCollapsed((c) => (c.includes(path) ? c.filter((x) => x !== path) : [...c, path]));

  return (
    <aside
      style={{
        width: 276,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: '#09090d',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: 0
      }}
    >
      <div style={{ padding: '12px 10px 4px', display: 'grid', gap: 2 }}>
        <NavRow icon={<Plus size={15} />} label="New thread" hint="Ctrl N" onClick={() => p.onNew()} />
        <NavRow icon={<Plug size={15} />} label="MCP servers" onClick={p.onOpenMcp} />
        <NavRow icon={<Monitor size={15} />} label="Computer control" active={p.computerOpen} onClick={p.onToggleComputer} />
        <NavRow icon={<CreditCard size={15} />} label="Plans and credits" onClick={p.onOpenBilling} />
      </div>

      <div style={{ padding: '8px 10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={13} color="#71717e" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads"
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: '#e4e4ec', fontSize: 12.5, fontFamily: 'inherit' }}
          />
          {query ? (
            <button onClick={() => setQuery('')} title="Clear" style={{ background: 'none', border: 'none', color: '#71717e', cursor: 'pointer', display: 'inline-flex', padding: 0 }}>
              <X size={13} />
            </button>
          ) : (
            <span style={{ fontSize: 10.5, color: '#5f5f6b' }}>Ctrl K</span>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 10px 0' }}>
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 11, background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setView('projects')}
              style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: view === 'projects' ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === 'projects' ? '#fff' : '#8e8e9c' }}
            >
              Projects
            </button>
            <button
              onClick={() => setView('recents')}
              style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: view === 'recents' ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === 'recents' ? '#fff' : '#8e8e9c' }}
            >
              Recents
            </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px 10px' }}>
        {groups.pins.length > 0 && (
          <>
            <SectionHeader label="PINNED" />
            {groups.pins.map((t) => row(t, false))}
          </>
        )}

        {view === 'projects' ? (
          <>
            <SectionHeader
              label="PROJECTS"
              action={
                <button onClick={p.onAddProject} title="Add project folder" className="sb-icon-btn">
                  <FolderPlus size={14} />
                </button>
              }
            />
            {groups.projects.length === 0 && !q && (
              <button
                onClick={p.onAddProject}
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.14)', background: 'transparent', color: '#71717e', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Add a project folder
              </button>
            )}
            {groups.projects.map(([path, list]) => {
              const open = !!q || !collapsed.includes(path);
              return (
                <div key={path} style={{ marginBottom: 2 }}>
                  <div
                    className="sb-row"
                    onClick={() => toggle(path)}
                    title={path}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 34px 7px 10px', borderRadius: 10, cursor: 'pointer' }}
                  >
                    {open ? <ChevronDown size={13} color="#71717e" /> : <ChevronRight size={13} color="#71717e" />}
                    <Folder size={14} color={RED} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#e4e4ec', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {baseName(path)}
                    </span>
                    <button className="sb-act" title="New thread in this project" onClick={(e) => { e.stopPropagation(); p.onNew(path); }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  {open && list.map((t) => row(t, true))}
                </div>
              );
            })}

            {groups.chats.length > 0 && <SectionHeader label="CHATS" />}
            {groups.chats.map((t) => row(t, false))}
          </>
        ) : (
          groups.buckets.map(([label, list]) => (
            <div key={label}>
              <SectionHeader label={label.toUpperCase()} />
              {list.map((t) => row(t, false))}
            </div>
          ))
        )}

        {groups.total === 0 && (
          <div style={{ padding: '10px', fontSize: 12.5, color: '#5f5f6b' }}>{q ? 'No threads match.' : 'No threads yet.'}</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: 12, display: 'grid', gap: 10 }}>
        {p.user ? (
          <>
            {p.usage && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
                  <span style={{ color: '#9b9ba8' }}>{p.usage.label}</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{p.usage.value}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: RED, width: p.usage.percent + '%', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.user.name}</div>
                <div style={{ fontSize: 11, color: '#71717e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.user.email}</div>
              </div>
              <button onClick={p.onLogout} title="Sign out" style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <button className="btn-red" style={{ width: '100%', padding: '10px', fontSize: 13 }} onClick={p.onOpenAuth}>
            Sign in
          </button>
        )}
      </div>
    </aside>
  );
}
