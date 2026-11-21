import React, { useEffect, useRef, useState } from 'react';
import {
  Binary, Cpu, CreditCard, FolderSearch, KeyRound, Laptop, LogOut,
  Monitor, Play, Plus, Send, Terminal, Trash2, Zap
} from 'lucide-react';
import { api, CatalogResponse, setToken, UserProfile } from '../lib/api';

export function WorkspaceApp({
  catalog,
  user,
  onUserChange,
  onOpenAuth,
  onOpenOperator,
  onGoLanding
}: {
  catalog: CatalogResponse;
  user: UserProfile | null;
  onUserChange: (u: UserProfile | null) => void;
  onOpenAuth: () => void;
  onOpenOperator: () => void;
  onGoLanding: () => void;
}) {
  const [tab, setTab] = useState<'chat' | 'terminal' | 'rea' | 'computer'>('chat');
  const [selectedModel, setSelectedModel] = useState(catalog.models[0]?.slug || 'deepseek-abliterated');
  const [computerEnabled, setComputerEnabled] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string; toolTrace?: any[] }[]>([
    {
      role: 'assistant',
      content: 'Abli Code online. Stock **REA MCP** (Reverse Engineer Anything) and **Computer Control** are mounted. Pick a model, drop a binary/repo path, or switch to **Abli Terminal**.'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState('');
  const [billingOpen, setBillingOpen] = useState(false);

  // Terminal state
  const [termCmd, setTermCmd] = useState('node -v');
  const [termLog, setTermLog] = useState<{ cmd: string; out: string; err?: string }[]>([]);

  // REA MCP + External MCP state
  const [reaPath, setReaPath] = useState('.');
  const [reaOut, setReaOut] = useState<any>(null);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpTransport, setNewMcpTransport] = useState<'stdio' | 'http'>('stdio');
  const [newMcpTarget, setNewMcpTarget] = useState('');

  // Computer control state
  const [compOut, setCompOut] = useState<any>(null);
  const [shotUrl, setShotUrl] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listMcpServers().then((d) => setMcpServers(d.servers || [])).catch(() => {});
    api.listMcpTools().then((d) => setMcpTools(d.tools || [])).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || busy) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    setQuotaAlert('');
    const nextMsgs = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMsgs);
    setPrompt('');
    setBusy(true);
    try {
      const res = await api.chat({
        modelSlug: selectedModel,
        messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        enableTools: true,
        computerControlEnabled: computerEnabled
      });
      setMessages([...nextMsgs, { role: 'assistant', content: res.content, toolTrace: res.toolTrace }]);
      if (res.user) onUserChange(res.user);
    } catch (err: any) {
      if (err.code === 'FREE_DAILY_LIMIT_REACHED' || err.code === 'CAP_150_REACHED' || err.code === 'UPGRADE_REQUIRED') {
        setQuotaAlert(err.message);
        setBillingOpen(true);
      } else {
        setMessages([...nextMsgs, { role: 'assistant', content: `Error: ${err.message}` }]);
      }
    } finally {
      setBusy(false);
    }
  };

  const runTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termCmd.trim()) return;
    const cmd = termCmd;
    setTermCmd('');
    const res = await api.execTerminal(cmd);
    setTermLog((prev) => [...prev, { cmd, out: res.stdout || '', err: res.stderr || '' }]);
  };

  const runRea = async (toolName: string) => {
    const argKey = toolName === 'rea_analyze_codebase' ? 'targetDir' : toolName === 'rea_rebuild_blueprint' ? 'targetPath' : 'filePath';
    const res = await api.invokeMcp('stock-rea', toolName, { [argKey]: reaPath });
    setReaOut(res.output);
  };

  const addExternalMcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName || !newMcpTarget) return;
    const payload = newMcpTransport === 'http'
      ? { name: newMcpName, transport: 'http', url: newMcpTarget }
      : { name: newMcpName, transport: 'stdio', command: newMcpTarget.split(' ')[0], args: newMcpTarget.split(' ').slice(1) };
    await api.saveMcpServer(payload);
    setNewMcpName(''); setNewMcpTarget('');
    const [s, t] = await Promise.all([api.listMcpServers(), api.listMcpTools()]);
    setMcpServers(s.servers || []);
    setMcpTools(t.tools || []);
  };

  const handleSubscribe = async (planId: string) => {
    const res: any = await api.subscribe(planId);
    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }
    if (res.user) onUserChange(res.user);
    setQuotaAlert('');
    setBillingOpen(false);
  };

  const handleTopup = async (amountUsd: number) => {
    const res: any = await api.topup(amountUsd);
    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }
    if (res.user) onUserChange(res.user);
    setQuotaAlert('');
    setBillingOpen(false);
  };

  const freePct = user ? Math.min(100, (user.freeUsedToday / user.freeLimitDaily) * 100) : 0;
  const capPct = user && user.spendCapUsd > 0 ? Math.min(100, (user.currentCycleSpendUsd / user.spendCapUsd) * 100) : 0;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      {/* Top Bar (supports frameless Electron window drag) */}
      <div className="drag-region" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #232329', background: '#08080b' }}>
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onGoLanding} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '0.08em', cursor: 'pointer' }}>
            ABLI <span style={{ color: '#ff1e38' }}>CODE</span>
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'chat', label: 'AI IDE', icon: Zap },
              { id: 'terminal', label: 'Abli Terminal', icon: Terminal },
              { id: 'rea', label: 'REA MCP & Hub', icon: Binary },
              { id: 'computer', label: 'Computer Control', icon: Monitor }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setTab(item.id as any)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: tab === item.id ? '#ff1e38' : '#121217', color: '#fff', border: '1px solid #27272e'
                }}>
                  <Icon size={13} /> {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div className="mono" style={{ fontSize: 11, background: '#111115', border: '1px solid #26262d', padding: '5px 10px' }}>
                FREE: <strong style={{ color: freePct >= 100 ? '#ff1e38' : '#fff' }}>{user.freeUsedToday.toLocaleString()}</strong>/1.5M
              </div>
              <div className="mono" style={{ fontSize: 11, background: '#111115', border: '1px solid #26262d', padding: '5px 10px' }}>
                {user.plan.toUpperCase()} CAP: <strong>${user.currentCycleSpendUsd.toFixed(2)}</strong>/${user.spendCapUsd.toFixed(2)} · CREDITS: <strong style={{ color: '#ff1e38' }}>${user.creditBalanceUsd.toFixed(2)}</strong>
              </div>
              <button className="btn-red" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => setBillingOpen(true)}>
                <CreditCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Upgrade / Top-Up
              </button>
              <button className="btn-outline" style={{ padding: '6px 10px', fontSize: 11 }} onClick={onOpenOperator}>
                <KeyRound size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />API Keys
              </button>
              <button className="btn-outline" style={{ padding: '6px 8px' }} title="Logout" onClick={() => { api.logout().catch(() => {}); setToken(''); onUserChange(null); }}>
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <button className="btn-red" style={{ padding: '7px 14px', fontSize: 12 }} onClick={onOpenAuth}>Sign In / Verify Email</button>
          )}

          {window.abliDesktop?.isDesktop && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              <button className="btn-outline" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => window.abliDesktop?.minimize()}>_</button>
              <button className="btn-outline" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => window.abliDesktop?.maximize()}>[]</button>
              <button className="btn-red" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => window.abliDesktop?.close()}>X</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {tab === 'chat' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr' }}>
            {/* Sidebar */}
            <aside style={{ borderRight: '1px solid #232329', padding: 16, overflowY: 'auto', background: '#08080b' }}>
              <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700, marginBottom: 10 }}>ABLITERATED MODELS</div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {catalog.models.map((m) => (
                  <button key={m.slug} onClick={() => setSelectedModel(m.slug)} style={{
                    textAlign: 'left', padding: 10, cursor: 'pointer',
                    background: selectedModel === m.slug ? '#16090c' : '#0d0d11',
                    border: selectedModel === m.slug ? '1px solid #ff1e38' : '1px solid #232329',
                    color: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{m.name}</span>
                      <span className="mono" style={{ fontSize: 10, padding: '2px 5px', background: m.tier === 'free' ? '#14532d' : '#ff1e38', color: '#fff' }}>{m.tier.toUpperCase()}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: '#a1a1aa' }}>{m.platform} · {m.providerReady ? 'KEY READY' : 'DEMO MODE'}</div>
                  </button>
                ))}
              </div>

              <div className="card-bwr" style={{ padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Agent Tool Mounts</div>
                <div style={{ fontSize: 11, color: '#d4d4d8', marginBottom: 6 }}>Stock REA MCP: <strong style={{ color: '#22c55e' }}>ACTIVE (5 tools)</strong></div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, cursor: 'pointer' }}>
                  <span>Computer Control MCP</span>
                  <input type="checkbox" checked={computerEnabled} onChange={(e) => setComputerEnabled(e.target.checked)} />
                </label>
              </div>

              {user && (
                <div className="card-bwr" style={{ padding: 12 }}>
                  <div className="mono" style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 6 }}>150% PLAN CAP METER</div>
                  <div style={{ height: 6, background: '#18181b', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${capPct}%`, background: '#ff1e38' }} />
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 6 }}>FREE DAILY (1.5M LIMIT)</div>
                  <div style={{ height: 6, background: '#18181b' }}>
                    <div style={{ height: '100%', width: `${freePct}%`, background: '#ffffff' }} />
                  </div>
                </div>
              )}
            </aside>

            {/* Chat Pane */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {quotaAlert && (
                <div style={{ background: '#26080d', borderBottom: '1px solid #ff1e38', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span><strong style={{ color: '#ff1e38' }}>HARD STOP:</strong> {quotaAlert}</span>
                  <button className="btn-red" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => setBillingOpen(true)}>Upgrade / Top-Up Now</button>
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'grid', gap: 14, alignContent: 'start' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    justifySelf: m.role === 'user' ? 'end' : 'start',
                    maxWidth: '82%',
                    background: m.role === 'user' ? '#170a0d' : '#0b0b0e',
                    border: m.role === 'user' ? '1px solid #ff1e38' : '1px solid #232329',
                    padding: '12px 16px',
                    whiteSpace: 'pre-wrap',
                    fontSize: 13,
                    lineHeight: 1.6
                  }}>
                    <div className="mono" style={{ fontSize: 10, color: m.role === 'user' ? '#ff1e38' : '#a1a1aa', marginBottom: 6 }}>
                      {m.role === 'user' ? 'YOU' : `ABLI CODE (${selectedModel})`}
                    </div>
                    {m.toolTrace && m.toolTrace.length > 0 && (
                      <div style={{ marginBottom: 10, padding: 8, background: '#050505', border: '1px dashed #35353f', fontSize: 11 }} className="mono">
                        {m.toolTrace.map((t, k) => <div key={k}>[MCP:{t.tool}] executed</div>)}
                      </div>
                    )}
                    {m.content}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChat} style={{ padding: 14, borderTop: '1px solid #232329', display: 'flex', gap: 10, background: '#08080b' }}>
                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask an abliterated model to code, inspect a binary with REA MCP, or control your PC..." style={{ flex: 1, padding: '12px 14px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 13 }} />
                <button className="btn-red" type="submit" disabled={busy} style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Send size={14} /> {busy ? 'Running...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'terminal' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div className="mono" style={{ fontSize: 11, color: '#ff1e38' }}>ABLI CODE TERMINAL</div>
                <div style={{ fontSize: 13, color: '#a1a1aa' }}>Run PowerShell / CLI commands and `npx abli` directly on your machine.</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['node bin/abli.mjs rea .', 'git status', 'Get-Process | Select -First 8 Name,Id'].map((preset) => (
                  <button key={preset} className="btn-outline mono" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => setTermCmd(preset)}>{preset}</button>
                ))}
              </div>
            </div>
            <div className="mono" style={{ flex: 1, overflowY: 'auto', background: '#08080b', border: '1px solid #232329', padding: 16, fontSize: 12, lineHeight: 1.5 }}>
              {termLog.length === 0 && <div style={{ color: '#71717a' }}>abli-terminal ready. Type any command below...</div>}
              {termLog.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: 14 }}>
                  <div style={{ color: '#ff1e38' }}>abli&gt; <span style={{ color: '#fff' }}>{entry.cmd}</span></div>
                  {entry.out && <pre style={{ margin: '4px 0 0', color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>{entry.out}</pre>}
                  {entry.err && <pre style={{ margin: '4px 0 0', color: '#ff4d61', whiteSpace: 'pre-wrap' }}>{entry.err}</pre>}
                </div>
              ))}
            </div>
            <form onSubmit={runTerm} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input className="mono" value={termCmd} onChange={(e) => setTermCmd(e.target.value)} placeholder="Enter shell / abli command..." style={{ flex: 1, padding: '12px', background: '#0b0b0e', border: '1px solid #ff1e38', color: '#fff', fontSize: 13 }} />
              <button className="btn-red" type="submit" style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}><Play size={14} /> Run</button>
            </form>
          </div>
        )}

        {tab === 'rea' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>STOCK REA MCP (REVERSE ENGINEER ANYTHING)</div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900 }}>Inspect Binaries, Extract Strings, Disassemble &amp; Rebuild</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="mono" value={reaPath} onChange={(e) => setReaPath(e.target.value)} placeholder="Path to .exe, .dll, .asar, .js, or folder" style={{ flex: 1, padding: '10px 12px', background: '#0b0b0e', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
                {window.abliDesktop?.isDesktop && (
                  <>
                    <button className="btn-outline" style={{ padding: '0 12px', fontSize: 12 }} onClick={async () => { const p = await window.abliDesktop?.pickFile(); if (p) setReaPath(p); }}>Pick File</button>
                    <button className="btn-outline" style={{ padding: '0 12px', fontSize: 12 }} onClick={async () => { const p = await window.abliDesktop?.pickFolder(); if (p) setReaPath(p); }}>Pick Folder</button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-red" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => runRea('rea_rebuild_blueprint')}>Rebuild Blueprint</button>
                <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => runRea('rea_inspect_binary')}>Inspect Binary / Entropy</button>
                <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => runRea('rea_extract_strings')}>Extract Strings &amp; URLs</button>
                <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => runRea('rea_disassemble')}>Disassemble / Inspect</button>
                <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => runRea('rea_analyze_codebase')}>Analyze Codebase</button>
              </div>
              <pre className="mono" style={{ flex: 1, minHeight: 340, overflowY: 'auto', background: '#08080b', border: '1px solid #232329', padding: 16, fontSize: 12, color: '#e4e4e7', whiteSpace: 'pre-wrap' }}>
                {reaOut ? JSON.stringify(reaOut, null, 2) : 'Select a binary or folder above and run any Stock REA MCP tool.'}
              </pre>
            </div>

            <aside style={{ borderLeft: '1px solid #232329', padding: 18, overflowY: 'auto', background: '#08080b' }}>
              <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700, marginBottom: 10 }}>MCP SERVER HUB ({mcpTools.length} TOOLS)</div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
                {mcpServers.map((s) => (
                  <div key={s.id} className="card-bwr" style={{ padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 12 }}>{s.name}</strong>
                      {!s.builtin && (
                        <button onClick={async () => { await api.deleteMcpServer(s.id); const d = await api.listMcpServers(); setMcpServers(d.servers || []); }} style={{ background: 'none', border: 'none', color: '#ff1e38', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4 }}>{s.transport.toUpperCase()} {s.builtin ? '· STOCK BUILTIN' : ''}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={addExternalMcp} className="card-bwr" style={{ padding: 12, display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={13} color="#ff1e38" /> Mount External MCP Server</div>
                <input placeholder="Server Name (e.g. GitHub)" value={newMcpName} onChange={(e) => setNewMcpName(e.target.value)} style={{ padding: '7px 9px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
                <select value={newMcpTransport} onChange={(e) => setNewMcpTransport(e.target.value as any)} style={{ padding: '7px 9px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }}>
                  <option value="stdio">Stdio Command</option>
                  <option value="http">Streamable HTTP URL</option>
                </select>
                <input placeholder={newMcpTransport === 'http' ? 'https://.../mcp' : 'npx -y @modelcontextprotocol/server-filesystem .'} value={newMcpTarget} onChange={(e) => setNewMcpTarget(e.target.value)} style={{ padding: '7px 9px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
                <button className="btn-red" type="submit" style={{ padding: '8px', fontSize: 12 }}>Connect MCP Server</button>
              </form>
            </aside>
          </div>
        )}

        {tab === 'computer' && (
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'grid', gap: 16, alignContent: 'start' }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>DESKTOP COMPUTER CONTROL</div>
              <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900 }}>Inspect Windows, Capture Screen &amp; Automate Local Tasks</h2>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-red" style={{ padding: '9px 14px', fontSize: 12 }} onClick={async () => { const r = await api.invokeMcp('stock-computer', 'computer_list_windows', {}); setCompOut(r.output); }}>
                <Laptop size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />List Active Windows
              </button>
              <button className="btn-outline" style={{ padding: '9px 14px', fontSize: 12 }} onClick={async () => { const r = await api.invokeMcp('stock-computer', 'computer_screenshot', {}); setShotUrl(r.output?.dataUrl || ''); setCompOut({ path: r.output?.path, bytes: r.output?.bytes }); }}>
                <Monitor size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Capture Screen Snapshot
              </button>
              <button className="btn-outline" style={{ padding: '9px 14px', fontSize: 12 }} onClick={async () => { const r = await api.invokeMcp('stock-computer', 'computer_list_dir', { dirPath: '.' }); setCompOut(r.output); }}>
                <FolderSearch size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />List Current Directory
              </button>
            </div>
            {shotUrl && <img src={shotUrl} alt="Desktop capture" style={{ maxWidth: 680, border: '1px solid #ff1e38' }} />}
            <pre className="mono" style={{ background: '#08080b', border: '1px solid #232329', padding: 16, fontSize: 12, color: '#e4e4e7', whiteSpace: 'pre-wrap' }}>
              {compOut ? JSON.stringify(compOut, null, 2) : 'Click a Computer Control action above or enable Computer Control MCP in AI IDE.'}
            </pre>
          </div>
        )}
      </div>

      {/* Upgrade & Credit Top-Up Modal (Stripe Checkout + 150% Cap) */}
      {billingOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 92, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 780, background: '#0b0b0e', border: '1px solid #ff1e38', padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="mono" style={{ fontSize: 11, color: '#ff1e38' }}>STRIPE SUBSCRIPTIONS &amp; CREDITS</div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Upgrade Plan (150% Spend Cap) or Top Up Credits</h2>
              </div>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setBillingOpen(false)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
              {catalog.plans.map((p) => (
                <div key={p.id} className="card-bwr" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ff1e38', margin: '4px 0' }}>${p.priceUsd}<span style={{ fontSize: 11, color: '#a1a1aa' }}>/mo</span></div>
                  <div className="mono" style={{ fontSize: 10, color: '#d4d4d8', marginBottom: 10 }}>{p.badge}</div>
                  <button className={p.id === user?.plan ? 'btn-outline' : 'btn-red'} style={{ width: '100%', padding: '8px', fontSize: 12 }} onClick={() => handleSubscribe(p.id)}>
                    {p.id === user?.plan ? 'Current Plan' : `Select ${p.name}`}
                  </button>
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 8 }}>INSTANT CREDIT TOP-UPS (BYPASSES 150% CAP HARD STOP)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {catalog.topUpPacks.map((t) => (
                <button key={t.id} className="btn-outline" style={{ padding: '10px 16px', fontSize: 13, borderColor: '#ff1e38' }} onClick={() => handleTopup(t.amountUsd)}>
                  <Cpu size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
