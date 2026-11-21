import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp, Check, ChevronDown, Cpu, CreditCard, FolderOpen,
  LogOut, PanelLeft, Paperclip, Maximize2, Minimize2, Monitor, Plus, Plug,
  Settings, Sparkles, Trash2, Wrench, X
} from 'lucide-react';
import { api, CatalogResponse, ModelConfig, UserProfile } from '../lib/api';
import { ShapeArt } from './ShapeArt';
import { AbliLogo } from './AbliLogo';
import { Sidebar } from './Sidebar';
import { AttachmentBar, MessageAttachments } from './AttachmentBar';
import { Attachment, readFiles, toApiMessage } from '../lib/attachments';
import { CheckoutModal, CheckoutRequest } from './CheckoutModal';

interface ThreadMessage {
  attachments?: Attachment[];
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelName?: string;
  toolTrace?: any[];
  createdAt: string;
}

interface Thread {
  id: string;
  title: string;
  workspacePath: string;
  modelSlug: string;
  messages: ThreadMessage[];
  updatedAt: string;
}

const THREADS_KEY = 'abli_codex_threads_v1';

function loadSavedThreads(defaultModelSlug: string, validSlugs: string[] = []): Thread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Threads saved with a model that no longer exists move to the default model.
        return parsed.map((t: Thread) => ({
          ...t,
          modelSlug: validSlugs.length === 0 || validSlugs.includes(t.modelSlug) ? t.modelSlug : defaultModelSlug
        }));
      }
    }
  } catch {}
  return [
    {
      id: crypto.randomUUID(),
      title: 'New thread',
      workspacePath: '',
      modelSlug: defaultModelSlug,
      messages: [],
      updatedAt: new Date().toISOString()
    }
  ];
}

function fmtTok(n: number) {
  return n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}K`;
}

export function WorkspaceApp({
  catalog,
  user,
  onUserChange,
  onOpenAuth,
  onBackLanding,
  onLogout
}: {
  catalog: CatalogResponse;
  user: UserProfile | null;
  onUserChange: (u: UserProfile) => void;
  onOpenAuth: () => void;
  onBackLanding: () => void;
  onLogout: () => void;
}) {
  const isDesktop = Boolean((window as any).abliDesktop?.isDesktop);
  const desktopApi = (window as any).abliDesktop;

  const defaultModelSlug = catalog.models[0]?.slug || 'deepseek-v4.1-flash-fast';
  const [threads, setThreads] = useState<Thread[]>(() => loadSavedThreads(defaultModelSlug, catalog.models.map((m) => m.slug)));
  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || '');

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  const [checkoutReq, setCheckoutReq] = useState<CheckoutRequest | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachNote, setAttachNote] = useState('');
  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    const { added, errors } = await readFiles(files, attachments);
    if (added.length) setAttachments((cur) => [...cur, ...added]);
    setAttachNote(errors.join(' '));
  };
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('abli_sidebar_open') !== '0'; } catch { return true; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  // Codex Popovers & Modals
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [computerDrawerOpen, setComputerDrawerOpen] = useState(false);

  // Tools & MCP state
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [enabledServers, setEnabledServers] = useState<string[]>(['stock-rea']);
  const [newMcp, setNewMcp] = useState({ name: '', transport: 'stdio', command: 'npx', args: '', url: '' });
  const [mcpBusy, setMcpBusy] = useState(false);

  // Computer Quick Control Drawer state
  const [shellCmd, setShellCmd] = useState('');
  const [shellOut, setShellOut] = useState('');
  const [screenshotData, setScreenshotData] = useState('');

  // Billing modal state
  const [billingHistory, setBillingHistory] = useState<{ transactions: any[]; usage: any[] }>({ transactions: [], usage: [] });
  const [billingBusy, setBillingBusy] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Photos are large: keep them only on the last two messages of the open thread so storage never fills up.
      const slim = threads.slice(0, 30).map((t) => ({
        ...t,
        messages: t.messages.map((m, i) =>
          m.attachments && !(t.id === activeThreadId && i >= t.messages.length - 2)
            ? { ...m, attachments: m.attachments.map((a) => (a.kind === 'image' ? { ...a, dataUrl: undefined } : a)) }
            : m
        )
      }));
      localStorage.setItem(THREADS_KEY, JSON.stringify(slim));
    } catch {}
  }, [threads]);

  useEffect(() => {
    refreshMcp();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeThread?.messages.length, sending]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const refreshMcp = async () => {
    try {
      const [sRes, tRes] = await Promise.all([api.listMcpServers(), api.listMcpTools()]);
      setMcpServers(sRes.servers || []);
      setMcpTools(tRes.tools || []);
    } catch {}
  };

  const refreshBillingHistory = async () => {
    if (!user) return;
    try {
      const hist = await api.billingHistory();
      setBillingHistory(hist);
    } catch {}
  };

  const updateActiveThread = (updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? updater(t) : t)));
  };

  const createNewThread = () => {
    const t: Thread = {
      id: crypto.randomUUID(),
      title: 'New thread',
      workspacePath: activeThread?.workspacePath || '',
      modelSlug: activeThread?.modelSlug || defaultModelSlug,
      messages: [],
      updatedAt: new Date().toISOString()
    };
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
    setChatError('');
  };

  const duplicateThread = (id: string) => {
    const src = threads.find((t) => t.id === id);
    if (!src) return;
    const copy: Thread = {
      ...src,
      id: crypto.randomUUID(),
      title: 'Copy of ' + src.title,
      messages: src.messages.map((m) => ({ ...m, id: crypto.randomUUID() })),
      updatedAt: new Date().toISOString()
    };
    setThreads((prev) => [copy, ...prev]);
    setActiveThreadId(copy.id);
  };

  const exportThread = (id: string) => {
    const src = threads.find((t) => t.id === id);
    if (!src) return;
    const lines: string[] = ['# ' + src.title, ''];
    for (const m of src.messages) {
      lines.push('## ' + (m.role === 'user' ? 'You' : 'Abli Code'), '', m.content || '', '');
      for (const a of m.attachments || []) lines.push('_Attachment: ' + a.name + '_', '');
    }
    const blob = new Blob([lines.join(String.fromCharCode(10))], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (src.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'thread') + '.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const startThread = (folder?: string) => {
    const t: Thread = {
      id: crypto.randomUUID(),
      title: 'New thread',
      workspacePath: folder !== undefined ? folder : activeThread?.workspacePath || '',
      modelSlug: activeThread?.modelSlug || defaultModelSlug,
      messages: [],
      updatedAt: new Date().toISOString()
    };
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
    setChatError('');
  };

  const addProject = async () => {
    let dir: string | null | undefined = '';
    if (isDesktop && desktopApi?.pickFolder) dir = await desktopApi.pickFolder();
    else dir = window.prompt('Enter local project folder path:', 'C:\\Users\\User');
    if (dir && dir.trim()) startThread(dir.trim());
  };

  useEffect(() => {
    try { localStorage.setItem('abli_sidebar_open', sidebarOpen ? '1' : '0'); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); setSidebarOpen((v) => !v); }
      else if (k === 'n') { e.preventDefault(); startThread(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const deleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fresh: Thread = {
          id: crypto.randomUUID(),
          title: 'New thread',
          workspacePath: '',
          modelSlug: defaultModelSlug,
          messages: [],
          updatedAt: new Date().toISOString()
        };
        setActiveThreadId(fresh.id);
        return [fresh];
      }
      if (activeThreadId === id) setActiveThreadId(remaining[0].id);
      return remaining;
    });
  };

  const pickWorkspaceFolder = async () => {
    if (isDesktop && desktopApi?.pickFolder) {
      const dir = await desktopApi.pickFolder();
      if (dir) updateActiveThread((t) => ({ ...t, workspacePath: dir }));
    } else {
      const typed = window.prompt('Enter local project folder path:', activeThread.workspacePath || 'C:\\Users\\User');
      if (typed !== null) updateActiveThread((t) => ({ ...t, workspacePath: typed.trim() }));
    }
  };

  const activeModel: ModelConfig =
    catalog.models.find((m) => m.slug === activeThread?.modelSlug) || catalog.models[0];

  const freeModels = catalog.models.filter((m) => m.tier === 'free');
  const cheapModels = catalog.models.filter((m) => m.tier === 'cheap');
  const premiumModels = catalog.models.filter((m) => m.tier === 'premium');

  const toggleServer = (id: string) => {
    setEnabledServers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const sendPrompt = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && attachments.length === 0) || sending) return;
    if (!user) {
      onOpenAuth();
      return;
    }

    setChatError('');
    if (!overrideText) {
      setInput('');
      setAttachments([]);
      setAttachNote('');
    }

    const userMsg: ThreadMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments: !overrideText && attachments.length ? attachments : undefined,
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...activeThread.messages, userMsg];
    const nextTitle =
      activeThread.messages.length === 0 ? (text || attachments[0]?.name || 'Attachment').slice(0, 42) + (text.length > 42 ? '...' : '') : activeThread.title;

    updateActiveThread((t) => ({
      ...t,
      title: nextTitle,
      messages: nextMessages,
      updatedAt: new Date().toISOString()
    }));

    setSending(true);
    try {
      const res = await api.chat({
        modelSlug: activeModel.slug,
        messages: nextMessages.map((m, i) => toApiMessage(m, i === nextMessages.length - 1)),
        enableTools: enabledServers.length > 0,
        computerControlEnabled: false,
        enabledServers,
        workspacePath: activeThread.workspacePath
      });

      const assistantMsg: ThreadMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.content,
        modelName: activeModel.name,
        toolTrace: res.toolTrace || [],
        createdAt: new Date().toISOString()
      };

      updateActiveThread((t) => ({
        ...t,
        messages: [...nextMessages, assistantMsg],
        updatedAt: new Date().toISOString()
      }));

      if (res.user) onUserChange(res.user);
    } catch (err: any) {
      setChatError(err.message);
      if (err.code === 'PLAN_LIMIT_REACHED' || err.code === 'UPGRADE_REQUIRED' || err.code === 'FREE_DAILY_LIMIT_REACHED') {
        setBillingOpen(true);
        refreshBillingHistory();
      }
    } finally {
      setSending(false);
    }
  };

  const handleAddMcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcp.name.trim()) return;
    setMcpBusy(true);
    try {
      const res = await api.addMcpServer({
        name: newMcp.name.trim(),
        transport: newMcp.transport,
        command: newMcp.command.trim(),
        args: newMcp.args.trim() ? newMcp.args.trim().split(/\s+/) : [],
        url: newMcp.url.trim()
      });
      if (res.server?.id) {
        setEnabledServers((prev) => Array.from(new Set([...prev, res.server.id])));
      }
      setNewMcp({ name: '', transport: 'stdio', command: 'npx', args: '', url: '' });
      await refreshMcp();
    } finally {
      setMcpBusy(false);
    }
  };

  const handleRunComputerCmd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shellCmd.trim()) return;
    setShellOut('Running...');
    try {
      const r: any = await api.execCommand(shellCmd.trim(), activeThread.workspacePath || undefined);
      setShellOut((r.stdout || '') + (r.stderr ? `\n${r.stderr}` : '') || '(no output)');
    } catch (err: any) {
      setShellOut(err.message);
    }
  };

  const handleCaptureScreen = async () => {
    try {
      const r = await api.invokeMcpTool('stock-computer', 'computer_screenshot', {});
      if (r.output?.base64) setScreenshotData(`data:image/png;base64,${r.output.base64}`);
    } catch {}
  };

  const freeModelStats =
    activeModel?.tier === 'free' && user?.freeUsageByModel?.[activeModel.slug]
      ? user.freeUsageByModel[activeModel.slug]
      : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#060608', color: '#fafafa', overflow: 'hidden' }}>

      {/* Main 2-or-3-Column Codex Layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {sidebarOpen && (
          <Sidebar
            threads={threads}
            activeId={activeThread?.id || ''}
            busyId={sending ? activeThread?.id : ''}
            modelName={(slug) => catalog.models.find((m) => m.slug === slug)?.name || slug}
            user={user}
            usage={(() => {
              if (!user) return null;
              if (freeModelStats) {
                const lim = (freeModelStats as any).limit;
                return { label: 'Daily usage limit', value: fmtTok(freeModelStats.used) + ' / ' + fmtTok(lim), percent: Math.min(100, (freeModelStats.used / lim) * 100) };
              }
              return {
                label: user.plan.toUpperCase() + ' Usage',
                value: user.plan === 'free' ? '$' + user.creditBalanceUsd.toFixed(2) + ' credits' : user.planUsagePercent.toFixed(0) + '%',
                percent: user.plan === 'free' ? 0 : Math.min(100, user.planUsagePercent)
              };
            })()}
            onDuplicate={duplicateThread}
            onExport={exportThread}
            onUsePrompt={(t) => setInput(t)}
            onSelect={(id) => { setActiveThreadId(id); setChatError(''); }}
            onNew={(folder) => startThread(folder)}
            onAddProject={addProject}
            onDelete={deleteThread}
            onRename={(id, title) => setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)))}
            onOpenMcp={() => setMcpModalOpen(true)}
            
            onOpenBilling={() => { setBillingOpen(true); refreshBillingHistory(); }}
            onLogout={onLogout}
            onOpenAuth={onOpenAuth}
            onToggle={() => setSidebarOpen(false)}
          />
        )}

        {/* Center Codex Thread Canvas */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 0', flexShrink: 0, minHeight: 44 }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Show sidebar (Ctrl+B)"
                className="glass-pill"
                style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#c4c4d0' }}
              >
                <PanelLeft size={15} />
              </button>
            )}
            <button
              onClick={pickWorkspaceFolder}
              className="glass-pill"
              style={{ padding: '5px 12px', fontSize: 12, color: activeThread?.workspacePath ? '#e4e4ec' : '#8e8e9c', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <FolderOpen size={13} color="#ff2a43" />
              <span style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeThread?.workspacePath || 'Select project folder'}
              </span>
            </button>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 16px' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              {activeThread?.messages.length === 0 ? (
                <div className="fade-up" style={{ textAlign: 'center', paddingTop: '8vh', paddingBottom: 32 }}>
                  <div style={{ display: 'inline-flex', marginBottom: 18 }}>
                    <ShapeArt size={380} />
                  </div>
                  <h1 style={{ fontSize: 34, fontWeight: 800, margin: '22px 0 10px', letterSpacing: '-0.03em' }}>
                    What are we building today?
                  </h1>
                  <p style={{ fontSize: 14.5, color: '#8e8e9c', margin: '0 auto 28px', maxWidth: 460 }}>
                    Switch between Abli Flash and Abli Coder models below and work directly in your folder.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, textAlign: 'left' }}>
                    {[
                      'Inspect the active folder and summarize the project architecture',
                      'Find bugs or type errors in this codebase and propose clean fixes',
                      'Review the recent changes in this folder and write a short summary',
                      'Design and scaffold a clean-room API service with tests'
                    ].map((starter) => (
                      <button
                        key={starter}
                        onClick={() => sendPrompt(starter)}
                        className="card-bwr"
                        style={{
                          padding: 15,
                          textAlign: 'left',
                          color: '#d4d4de',
                          fontSize: 13,
                          lineHeight: 1.45,
                          cursor: 'pointer'
                        }}
                      >
                        <Sparkles size={13} color="#ff2a43" style={{ marginBottom: 8, display: 'block' }} />
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {activeThread.messages.map((m) => (
                    <div
                      key={m.id}
                      className="pop-in"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {m.role === 'user' ? (
                        <div
                          style={{
                            maxWidth: '82%',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 18,
                            padding: '12px 16px',
                            fontSize: 14,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {m.content}
                          {m.attachments && m.attachments.length > 0 && <MessageAttachments items={m.attachments} />}
                        </div>
                      ) : (
                        <div style={{ width: '100%', display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8e8e9c' }}>
                            <AbliLogo size={18} />
                            <span style={{ fontWeight: 600, color: '#e4e4ec' }}>{m.modelName || 'Abli Code'}</span>
                          </div>

                          {m.toolTrace && m.toolTrace.length > 0 && (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {m.toolTrace.map((tr, i) => (
                                <details
                                  key={i}
                                  style={{
                                    background: 'rgba(255,42,67,0.06)',
                                    border: '1px solid rgba(255,42,67,0.2)',
                                    borderRadius: 14,
                                    padding: '8px 12px',
                                    fontSize: 12
                                  }}
                                >
                                  <summary style={{ cursor: 'pointer', color: '#ff8a97', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Wrench size={12} /> {tr.tool}
                                  </summary>
                                  <pre className="mono" style={{ fontSize: 11, color: '#c4c4d0', overflowX: 'auto', margin: '8px 0 0' }}>
                                    {JSON.stringify(tr.output, null, 2)}
                                  </pre>
                                </details>
                              ))}
                            </div>
                          )}

                          <div
                            style={{
                              background: 'rgba(255,255,255,0.025)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 18,
                              padding: '14px 18px',
                              fontSize: 14,
                              lineHeight: 1.68,
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {m.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sending && (
                    <div className="pop-in" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9b9ba8', padding: '6px 4px' }}>
                      <AbliLogo size={18} />
                      <span className="think-shapes" aria-hidden="true"><i /><i /><i /></span>
                      <span>Thinking with {activeModel?.name}...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Floating Codex-Style Composer */}
          <div ref={composerRef} style={{ padding: '10px 24px 20px', position: 'relative' }}>
            <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
              {chatError && (
                <div
                  className="pop-in"
                  style={{
                    marginBottom: 10,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'rgba(255,42,67,0.12)',
                    border: '1px solid rgba(255,42,67,0.35)',
                    fontSize: 12.5,
                    color: '#ff9aa6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <span>{chatError}</span>
                  <button className="btn-red" style={{ padding: '5px 12px', fontSize: 11.5 }} onClick={() => setBillingOpen(true)}>
                    Plans / Top Up
                  </button>
                </div>
              )}

              {/* Model Switcher Popover */}
              {modelMenuOpen && (
                <div onClick={() => setModelMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 25, background: 'rgba(0,0,0,0.62)' }} />
              )}
              {modelMenuOpen && (
                <div
                  className="pop-in"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: 10,
                    width: 360,
                    maxWidth: '94vw',
                    maxHeight: 420,
                    overflowY: 'auto',
                    background: '#111116',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20,
                    padding: 10,
                    zIndex: 30
                  }}
                >
                  {[
                    { label: 'FREE MODELS', items: freeModels },
                    { label: 'CHEAP AND FAST', items: cheapModels },
                    { label: 'FLAGSHIP', items: premiumModels }
                  ].map((group) => (
                    <div key={group.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: '#ff2a43', padding: '6px 10px' }}>{group.label}</div>
                      {group.items.map((m) => {
                        const selected = m.slug === activeModel?.slug;
                        const freeInfo = m.tier === 'free' ? user?.freeUsageByModel?.[m.slug] : null;
                        const freeExhausted = freeInfo ? freeInfo.remaining <= 0 : false;
                        return (
                          <button
                            key={m.slug}
                            onClick={() => {
                              updateActiveThread((t) => ({ ...t, modelSlug: m.slug }));
                              setModelMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 11px',
                              borderRadius: 12,
                              border: 'none',
                              background: selected ? 'rgba(255,42,67,0.14)' : 'transparent',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {m.name}
                                {selected && <Check size={13} color="#ff2a43" />}
                              </div>
                              <div style={{ fontSize: 11, color: freeExhausted ? '#ff6b7d' : '#8e8e9c' }}>
                                {freeInfo
                                  ? `${fmtTok(freeInfo.used)} / ${fmtTok((freeInfo as any).limit)} used today`
                                  : m.description}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 10.5,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: m.tier === 'free' ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.07)',
                                color: m.tier === 'free' ? '#4ade80' : '#c4c4d0',
                                flexShrink: 0
                              }}
                            >
                              {m.tier === 'free' ? 'FREE' : m.tier === 'cheap' ? 'CHEAP' : 'PRO'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* + Tools & MCP Popover */}
              {toolsMenuOpen && (
                <div
                  className="pop-in"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 110,
                    marginBottom: 10,
                    width: 340,
                    maxWidth: '94vw',
                    background: '#111116',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 20,
                    padding: 12,
                    zIndex: 30
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px 8px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Active Tools &amp; MCP Servers</span>
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setMcpModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ff6b7d', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={13} /> Add MCP
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                    {mcpServers.map((s) => {
                      const on = enabledServers.includes(s.id);
                      const toolCount = mcpTools.filter((t) => t.serverId === s.id && !t.error).length;
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleServer(s.id)}
                          style={{
                            width: '100%',
                            padding: '9px 11px',
                            borderRadius: 12,
                            background: on ? 'rgba(255,42,67,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${on ? 'rgba(255,42,67,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: '#8e8e9c' }}>{toolCount} tools / {s.transport}</div>
                          </div>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 6,
                              background: on ? '#ff2a43' : 'rgba(255,255,255,0.08)',
                              display: 'grid',
                              placeItems: 'center'
                            }}
                          >
                            {on && <Check size={12} color="#fff" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rounded Composer Box */}
              <div
                style={{
                  background: '#101015',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 22,
                  padding: '12px 14px',
                }}
              >
                {(attachments.length > 0 || attachNote) && (
                  <AttachmentBar
                    items={attachments}
                    note={attachNote || (attachments.some((a) => a.kind === 'image') && !activeModel?.vision ? (activeModel?.name || 'This model') + ' may not be able to see photos. Muse Spark Open can.' : '')}
                    onRemove={(id) => setAttachments((cur) => cur.filter((a) => a.id !== id))}
                  />
                )}
                <textarea
                  onPaste={(e) => {
                    const pasted = Array.from(e.clipboardData.files || []);
                    if (pasted.length) {
                      e.preventDefault();
                      addFiles(pasted);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    if (e.dataTransfer.files && e.dataTransfer.files.length) {
                      e.preventDefault();
                      addFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendPrompt();
                    }
                  }}
                  placeholder={`Ask ${activeModel?.name || 'Abli Code'} anything...`}
                  rows={2}
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.55,
                    marginBottom: 10
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      id="abli-file-input"
                      type="file"
                      multiple
                      accept="image/*,.txt,.md,.json,.csv,.log,.yaml,.yml,.toml,.xml,.html,.css,.js,.mjs,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.kt,.c,.h,.cpp,.cs,.php,.sh,.ps1,.sql"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []);
                        e.target.value = '';
                        addFiles(list);
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('abli-file-input')?.click()}
                      className="glass-pill"
                      title="Attach photos or files"
                      style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: attachments.length ? '#ff6b7d' : '#c4c4d0' }}
                    >
                      <Paperclip size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setModelMenuOpen((v) => !v);
                      }}
                      className="glass-pill"
                      style={{ padding: '6px 12px', fontSize: 12.5, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <Cpu size={13} color="#ff2a43" />
                      <span>{activeModel?.name}</span>
                      <ChevronDown size={13} color="#8e8e9c" />
                    </button>

                  </div>

                  <button
                    className="btn-red"
                    disabled={sending || !input.trim()}
                    onClick={() => sendPrompt()}
                    style={{ width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', padding: 0 }}
                    title="Send"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Collapsible Right Computer Control Drawer */}
        {computerDrawerOpen && (
          <aside
            className="pop-in"
            style={{
              width: 340,
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              background: '#09090d',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Monitor size={15} color="#ff2a43" /> Computer Control
              </span>
              <button onClick={() => setComputerDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <button className="btn-outline" style={{ padding: '9px 12px', fontSize: 12.5, borderRadius: 12 }} onClick={handleCaptureScreen}>
              Capture Screen Snapshot
            </button>

            {screenshotData && (
              <img src={screenshotData} alt="Screen" style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }} />
            )}

            <form onSubmit={handleRunComputerCmd} style={{ display: 'flex', gap: 6 }}>
              <input
                value={shellCmd}
                onChange={(e) => setShellCmd(e.target.value)}
                placeholder="Run a system command..."
                style={{
                  flex: 1,
                  padding: '9px 11px',
                  borderRadius: 12,
                  background: '#111116',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 12.5
                }}
              />
              <button className="btn-red" type="submit" style={{ padding: '0 14px', borderRadius: 12, fontSize: 12 }}>
                Run
              </button>
            </form>

            {shellOut && (
              <pre
                className="mono"
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 12,
                  background: '#050507',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11.5,
                  color: '#d4d4de',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 320,
                  overflowY: 'auto'
                }}
              >
                {shellOut}
              </pre>
            )}
          </aside>
        )}
      </div>

      {/* Add / Manage MCP Servers Modal */}
      {mcpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="pop-in" style={{ width: '100%', maxWidth: 540, background: '#0e0e13', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>MCP Servers &amp; Tools</h3>
              <button onClick={() => setMcpModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddMcp} style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                <input
                  value={newMcp.name}
                  onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                  placeholder="Server name (e.g. GitHub, Postgres)"
                  required
                  style={{ padding: '10px 12px', borderRadius: 12, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                />
                <select
                  value={newMcp.transport}
                  onChange={(e) => setNewMcp({ ...newMcp, transport: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 12, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                >
                  <option value="stdio">stdio</option>
                  <option value="http">HTTP</option>
                </select>
              </div>
              {newMcp.transport === 'stdio' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                  <input
                    value={newMcp.command}
                    onChange={(e) => setNewMcp({ ...newMcp, command: e.target.value })}
                    placeholder="npx"
                    style={{ padding: '10px 12px', borderRadius: 12, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                  />
                  <input
                    value={newMcp.args}
                    onChange={(e) => setNewMcp({ ...newMcp, args: e.target.value })}
                    placeholder="-y @modelcontextprotocol/server-filesystem C:\path"
                    style={{ padding: '10px 12px', borderRadius: 12, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                  />
                </div>
              ) : (
                <input
                  value={newMcp.url}
                  onChange={(e) => setNewMcp({ ...newMcp, url: e.target.value })}
                  placeholder="https://your-mcp-endpoint/mcp"
                  style={{ padding: '10px 12px', borderRadius: 12, background: '#15151c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                />
              )}
              <button className="btn-red" type="submit" disabled={mcpBusy} style={{ padding: '10px', borderRadius: 12, fontSize: 13 }}>
                {mcpBusy ? 'Adding...' : 'Mount MCP Server'}
              </button>
            </form>

            <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {mcpServers.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#14141a', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#8e8e9c' }}>{s.transport} / {s.builtIn ? 'Built-in' : 'Custom'}</div>
                  </div>
                  {!s.builtIn && (
                    <button
                      onClick={async () => {
                        await api.deleteMcpServer(s.id);
                        refreshMcp();
                      }}
                      style={{ background: 'none', border: 'none', color: '#ff6b7d', cursor: 'pointer', fontSize: 12 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plans & Stripe Top-Up Modal (Undisclosed backend cap) */}
              <CheckoutModal
          req={checkoutReq}
          onClose={() => setCheckoutReq(null)}
          onComplete={async (sid) => {
            try {
              const r = await api.verifyStripeSession(sid);
              onUserChange(r.user);
            } catch (e: any) {
              alert(e.message);
            }
            setCheckoutReq(null);
            setBillingOpen(false);
            refreshBillingHistory();
          }}
        />

{billingOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.78)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="pop-in" style={{ width: '100%', maxWidth: 820, maxHeight: '90vh', overflowY: 'auto', background: '#0e0e13', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Plans &amp; Credit Top-Ups</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8e8e9c' }}>
                  Current plan: <strong style={{ color: '#fff' }}>{user?.plan.toUpperCase() || 'FREE'}</strong> / Credits: <strong style={{ color: '#fff' }}>${(user?.creditBalanceUsd || 0).toFixed(2)}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {user && user.plan !== 'free' && (
                  <button
                    className="btn-outline"
                    style={{ padding: '7px 14px', fontSize: 12 }}
                    onClick={async () => {
                      if (!window.confirm('Cancel your ' + user.plan.toUpperCase() + ' plan now? You will move to the Free plan.')) return;
                      try {
                        const r = await api.cancelPlan();
                        onUserChange(r.user);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                  >
                    Cancel plan
                  </button>
                )}
                <button onClick={() => setBillingOpen(false)} style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#8e8e9c', margin: '0 0 10px' }}>Switch plans anytime. Changes are prorated, and Free ends your paid plan right away.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 20 }}>
              {catalog.plans.map((p) => (
                <div key={p.id} className="plan-card" style={{ background: '#14141b', border: `1px solid ${user?.plan === p.id ? '#ff2a43' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0' }}>${p.priceUsd}<span style={{ fontSize: 12, color: '#8e8e9c' }}>/mo</span></div>
                    <p style={{ fontSize: 12, color: '#9b9ba8', margin: '0 0 14px', lineHeight: 1.45 }}>{p.tagline}</p>
                  </div>
                  <button
                    className={user?.plan === p.id ? 'btn-outline' : 'btn-red'}
                    style={{ width: '100%', padding: '8px', fontSize: 12 }}
                    disabled={billingBusy === p.id}
                    onClick={async () => {
                      if (!user) return onOpenAuth();
                      if (p.priceUsd === 0 && !window.confirm('Switch to Free? Your paid plan ends now.')) return;
                      setBillingBusy(p.id);
                      try {
                        const r = await api.subscribe(p.id);
                        if (r.clientSecret && r.publishableKey && r.sessionId) setCheckoutReq({ clientSecret: r.clientSecret, publishableKey: r.publishableKey, sessionId: r.sessionId, title: p.name + ' plan, $' + p.priceUsd + '/mo' });
                        else if (r.checkoutUrl) window.location.href = r.checkoutUrl;
                        else if (r.user) onUserChange(r.user);
                      } finally {
                        setBillingBusy('');
                      }
                    }}
                  >
                    {user?.plan === p.id ? 'Current plan' : p.priceUsd === 0 ? 'Switch to Free' : p.priceUsd > (catalog.plans.find((x) => x.id === user?.plan)?.priceUsd ?? 0) ? 'Upgrade to ' + p.name : 'Downgrade to ' + p.name}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: '#14141b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Top up credits</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {catalog.topUpPacks.map((pack) => (
                  <button
                    key={pack.id}
                    className="btn-outline"
                    style={{ padding: '8px 16px', fontSize: 12.5 }}
                    onClick={async () => {
                      if (!user) return onOpenAuth();
                      const r = await api.topup(pack.amountUsd);
                      if (r.clientSecret && r.publishableKey && r.sessionId) setCheckoutReq({ clientSecret: r.clientSecret, publishableKey: r.publishableKey, sessionId: r.sessionId, title: '$' + pack.amountUsd + ' credits' });
                      else if (r.checkoutUrl) window.location.href = r.checkoutUrl;
                      else if (r.user) onUserChange(r.user);
                    }}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>
            </div>

            {billingHistory.transactions.length > 0 && (
              <div style={{ fontSize: 12, color: '#8e8e9c' }}>
                <div style={{ fontWeight: 600, color: '#d4d4de', marginBottom: 6 }}>Recent Billing Activity</div>
                {billingHistory.transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>{tx.itemName}</span>
                    <span style={{ color: '#fff' }}>${Number(tx.amountUsd).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


