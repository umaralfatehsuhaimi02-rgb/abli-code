import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArchiveRestore, BookOpen, ChevronDown, Cpu, ChevronRight, Copy, CreditCard, Download, Folder, FolderPlus, LogOut,
  MoreHorizontal, PanelLeft, Pencil, Pin, PinOff, Plug, Plus, Search, Trash2, X
} from 'lucide-react';
import { PromptLibrary } from './PromptLibrary';
import { Portal } from './Portal';
import { ModelShape } from './ModelShape';

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
  onSelect: (id: string) => void;
  onNew: (folder?: string) => void;
  onAddProject: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onUsePrompt: (text: string) => void;
  onOpenMcp: () => void;
  onOpenLocal?: () => void;
  onOpenBilling: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onToggle: () => void;
}

type View = 'projects' | 'recents' | 'archived';
type Confirm = { kind: 'signout' } | { kind: 'delete'; id: string };

const RED = '#ff2a43';
const COLLAPSE_KEY = 'abli_sidebar_collapsed_v1';
const PIN_KEY = 'abli_sidebar_pinned_v1';
const VIEW_KEY = 'abli_sidebar_view_v1';
const ARCHIVE_KEY = 'abli_sidebar_archived_v1';

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

function loadList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function NavRow({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      className="sb-row"
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: 'none', color: '#d4d4de', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
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
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <i style={{ display: 'inline-block', width: 6, height: 6, background: RED, borderRadius: 1 }} />
        {label}
      </span>
      {action}
    </div>
  );
}

function ThreadRow({ t, active, busy, indent, tip, pinned, editing, onSelect, onMenu, onStartRename, onCommitRename, onCancelRename }: {
  t: SidebarThread; active: boolean; busy: boolean; indent: boolean; tip: string; pinned: boolean; editing: boolean;
  onSelect: (id: string) => void; onMenu: (id: string, x: number, y: number) => void;
  onStartRename: (id: string) => void; onCommitRename: (id: string, title: string) => void; onCancelRename: () => void;
}) {
  const [draft, setDraft] = useState(t.title);
  useEffect(() => { if (editing) setDraft(t.title); }, [editing]);
  const commit = () => {
    const v = draft.trim();
    if (v && v !== t.title) onCommitRename(t.id, v);
    else onCancelRename();
  };
  return (
    <div
      className={'sb-row sb-thread' + (active ? ' sb-active' : '')}
      onClick={() => { if (!editing) onSelect(t.id); }}
      onDoubleClick={() => onStartRename(t.id)}
      onContextMenu={(e) => { e.preventDefault(); onMenu(t.id, e.clientX + 190, e.clientY); }}
      title={tip}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 36px 7px ' + (indent ? 32 : 12) + 'px', borderRadius: 10, cursor: 'pointer' }}
    >
      {active && <span style={{ position: 'absolute', left: indent ? 20 : 3, top: 8, bottom: 8, width: 3, borderRadius: 3, background: RED }} />}
      {!editing && <ModelShape name={tip} size={8} color={active ? RED : '#4a4a56'} />}
      {pinned && !editing && <Pin size={11} color={RED} style={{ flexShrink: 0 }} />}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') onCancelRename();
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
        <button
          className="sb-act"
          title="Thread actions"
          onClick={(e) => {
            e.stopPropagation();
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onMenu(t.id, r.right, r.bottom);
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      )}
    </div>
  );
}

export function Sidebar(p: SidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>(() => loadList(COLLAPSE_KEY));
  const [pinned, setPinned] = useState<string[]>(() => loadList(PIN_KEY));
  const [archived, setArchived] = useState<string[]>(() => loadList(ARCHIVE_KEY));
  const [view, setView] = useState<View>(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return v === 'recents' || v === 'archived' ? v : 'projects';
    } catch { return 'projects'; }
  });
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem(PIN_KEY, JSON.stringify(pinned)); } catch {} }, [pinned]);
  useEffect(() => { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived)); } catch {} }, [archived]);
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === 'Escape') {
        setMenu(null);
        setConfirm(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const togglePin = (id: string) => setPinned((c) => (c.includes(id) ? c.filter((x) => x !== id) : [id, ...c]));
  const toggleArchive = (id: string) => setArchived((c) => (c.includes(id) ? c.filter((x) => x !== id) : [id, ...c]));

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const filtered = p.threads.filter((t) => !q || t.title.toLowerCase().includes(q) || baseName(t.workspacePath || '').toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const archivedList = sorted.filter((t) => archived.includes(t.id));
    const live = sorted.filter((t) => !archived.includes(t.id));
    const pins = pinned.map((id) => live.find((t) => t.id === id)).filter(Boolean) as SidebarThread[];
    const rest = live.filter((t) => !pinned.includes(t.id));
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
    return { pins, archivedList, projects: Array.from(projects.entries()), chats, buckets: buckets.filter((b) => b[1].length > 0), total: live.length };
  }, [p.threads, q, pinned, archived]);

  const archivedCount = p.threads.filter((t) => archived.includes(t.id)).length;

  const row = (t: SidebarThread, indent: boolean) => (
    <ThreadRow
      key={t.id}
      t={t}
      indent={indent}
      active={t.id === p.activeId}
      busy={t.id === p.busyId}
      pinned={pinned.includes(t.id)}
      editing={renamingId === t.id}
      tip={p.modelName(t.modelSlug)}
      onSelect={p.onSelect}
      onMenu={(id, x, y) => setMenu({ id, x, y })}
      onStartRename={(id) => setRenamingId(id)}
      onCommitRename={(id, title) => { p.onRename(id, title); setRenamingId(null); }}
      onCancelRename={() => setRenamingId(null)}
    />
  );

  const toggle = (path: string) => setCollapsed((c) => (c.includes(path) ? c.filter((x) => x !== path) : [...c, path]));

  const segBtn = (v: View, label: string) => (
    <button
      onClick={() => setView(v)}
      style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: view === v ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === v ? '#fff' : '#8e8e9c' }}
    >
      {label}
    </button>
  );

  const menuThread = menu ? p.threads.find((t) => t.id === menu.id) : undefined;
  const confirmThread = confirm && confirm.kind === 'delete' ? p.threads.find((t) => t.id === confirm.id) : undefined;

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'signout') p.onLogout();
    else p.onDelete(confirm.id, { stopPropagation: () => {} } as unknown as React.MouseEvent);
    setConfirm(null);
  };

  return (
    <aside className="sb-root"
      style={{ width: 276, borderRight: '1px solid rgba(255,255,255,0.07)', background: '#09090d', display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0 }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px 0' }}>
        <button onClick={p.onToggle} title="Hide sidebar (Ctrl+B)" className="sb-icon-btn">
          <PanelLeft size={16} />
        </button>
      </div>

      <div style={{ padding: '4px 10px 4px', display: 'grid', gap: 2 }}>
        <NavRow icon={<Plus size={15} />} label="New thread" hint="Ctrl N" onClick={() => p.onNew()} />
        <NavRow icon={<BookOpen size={15} />} label="Prompts" onClick={() => setPromptsOpen(true)} />
        <NavRow icon={<Plug size={15} />} label="MCP servers" onClick={p.onOpenMcp} />
        {p.onOpenLocal && <NavRow icon={<Cpu size={15} />} label="Abli Mini" onClick={p.onOpenLocal} />}
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
          {segBtn('projects', 'Projects')}
          {segBtn('recents', 'Recents')}
          {segBtn('archived', archivedCount > 0 ? 'Archived ' + archivedCount : 'Archived')}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px 10px' }}>
        {view !== 'archived' && groups.pins.length > 0 && (
          <>
            <SectionHeader label="PINNED" />
            {groups.pins.map((t) => row(t, false))}
          </>
        )}

        {view === 'projects' && (
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
        )}

        {view === 'recents' &&
          groups.buckets.map(([label, list]) => (
            <div key={label}>
              <SectionHeader label={label.toUpperCase()} />
              {list.map((t) => row(t, false))}
            </div>
          ))}

        {view === 'archived' && (
          <>
            <SectionHeader label="ARCHIVED" />
            {groups.archivedList.map((t) => row(t, false))}
            {groups.archivedList.length === 0 && (
              <div style={{ padding: '10px', fontSize: 12.5, color: '#5f5f6b' }}>Nothing archived. Use the ... menu on a thread to archive it.</div>
            )}
          </>
        )}

        {view !== 'archived' && groups.total === 0 && (
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
              <button onClick={() => setConfirm({ kind: 'signout' })} title="Sign out" style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
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

      {menu && menuThread && (
        <Portal>
          <div onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div
            className="pop-in"
            style={{ position: 'fixed', left: Math.max(8, Math.min(menu.x - 196, window.innerWidth - 208)), top: Math.max(8, Math.min(menu.y + 4, window.innerHeight - 262)), width: 196, zIndex: 61, background: '#111116', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 6 }}
          >
            {[
              { icon: <Pencil size={14} />, label: 'Rename', run: () => setRenamingId(menuThread.id) },
              { icon: pinned.includes(menuThread.id) ? <PinOff size={14} /> : <Pin size={14} />, label: pinned.includes(menuThread.id) ? 'Unpin' : 'Pin to top', run: () => togglePin(menuThread.id) },
              { icon: <Copy size={14} />, label: 'Duplicate', run: () => p.onDuplicate(menuThread.id) },
              { icon: <Download size={14} />, label: 'Export as Markdown', run: () => p.onExport(menuThread.id) },
              { icon: archived.includes(menuThread.id) ? <ArchiveRestore size={14} /> : <Archive size={14} />, label: archived.includes(menuThread.id) ? 'Unarchive' : 'Archive', run: () => toggleArchive(menuThread.id) },
              { icon: <Trash2 size={14} />, label: 'Delete', danger: true, run: () => setConfirm({ kind: 'delete', id: menuThread.id }) }
            ].map((item) => (
              <button
                key={item.label}
                className="sb-row"
                onClick={() => { setMenu(null); item.run(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, border: 'none', fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: (item as any).danger ? '#ff6b7d' : '#d4d4de' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </Portal>
      )}

      {confirm && (
        <Portal><div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '92vw', background: '#111116', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {confirm.kind === 'signout' ? 'Sign out of Abli Code?' : 'Delete this thread?'}
            </div>
            <p style={{ fontSize: 13.5, color: '#9b9ba8', lineHeight: 1.55, margin: '0 0 20px' }}>
              {confirm.kind === 'signout'
                ? 'You will need to sign in again to keep chatting. Your threads stay saved on this device.'
                : (confirmThread ? '"' + confirmThread.title + '"' : 'This thread') + ' will be removed from this device. This cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button autoFocus className="btn-outline" onClick={() => setConfirm(null)} style={{ padding: '9px 18px', fontSize: 13 }}>
                Cancel
              </button>
              <button className="btn-red" onClick={runConfirm} style={{ padding: '9px 18px', fontSize: 13 }}>
                {confirm.kind === 'signout' ? 'Sign out' : 'Delete'}
              </button>
            </div>
          </div>
        </div></Portal>
      )}

      <Portal><PromptLibrary open={promptsOpen} onClose={() => setPromptsOpen(false)} onUse={p.onUsePrompt} /></Portal>
    </aside>
  );
}
