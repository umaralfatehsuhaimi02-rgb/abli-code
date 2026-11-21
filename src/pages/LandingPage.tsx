import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Binary, Check, Code2, Cpu, Download, Github,
  KeyRound, Lock, Mail, Monitor, Shield, Terminal, Zap
} from 'lucide-react';
import { api, CatalogResponse, UserProfile } from '../lib/api';

const DEMO_LINES = [
  '$ abli rea ./target-app.exe',
  '[REA MCP] PE32+ x86_64 · Entropy 6.14 (unpacked)',
  '[REA MCP] Extracted 42 endpoints & 11 IPC bridges',
  '[GLM 5.3 Abliterated] Generating clean-room TypeScript + Rust rebuild...',
  '[QUOTA] DeepSeek Free: 412,900 / 1,500,000 tokens today · Max Cap: $14.20 / $150.00 (150%)'
];

export function LandingPage({
  catalog,
  user,
  onLaunchApp,
  onOpenAuth,
  onOpenOperator,
  onOpenLegal,
  onOpenCookiePrefs
}: {
  catalog: CatalogResponse;
  user: UserProfile | null;
  onLaunchApp: () => void;
  onOpenAuth: () => void;
  onOpenOperator: () => void;
  onOpenLegal: (s: 'terms' | 'privacy' | 'aup' | 'cookies') => void;
  onOpenCookiePrefs: () => void;
}) {
  const [lineIdx, setLineIdx] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setLineIdx((n) => (n >= DEMO_LINES.length ? 1 : n + 1)), 1400);
    return () => clearInterval(timer);
  }, []);

  const handlePlanSelect = async (planId: string) => {
    if (!user) return onOpenAuth();
    const res: any = await api.subscribe(planId);
    if (res.checkoutUrl) window.location.href = res.checkoutUrl;
    else onLaunchApp();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', position: 'relative' }}>
      {/* Top Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)', background: 'rgba(5,5,5,0.86)', borderBottom: '1px solid #1c1c22' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, background: '#ff1e38', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13 }}>A</div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '0.1em' }}>ABLI <span style={{ color: '#ff1e38' }}>CODE</span></span>
            <span className="mono" style={{ fontSize: 10, padding: '2px 7px', border: '1px solid #27272e', color: '#a1a1aa' }}>MIT OPEN SOURCE</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13 }}>
            <a href="#models" style={{ color: '#d4d4d8' }}>Models</a>
            <a href="#pricing" style={{ color: '#d4d4d8' }}>150% Pricing</a>
            <a href="#rea" style={{ color: '#d4d4d8' }}>REA MCP</a>
            <a href="https://github.com/umaralfatehsuhaimi02-rgb/abli-code" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#d4d4d8' }}>
              <Github size={14} /> GitHub
            </a>
            <button className="btn-outline" style={{ padding: '7px 12px', fontSize: 12 }} onClick={onOpenOperator}>
              <KeyRound size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />Operator Setup
            </button>
            {user ? (
              <button className="btn-red" style={{ padding: '8px 14px', fontSize: 12 }} onClick={onLaunchApp}>Open Workspace</button>
            ) : (
              <button className="btn-red" style={{ padding: '8px 14px', fontSize: 12 }} onClick={onOpenAuth}>Sign In / Verify</button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-grid" style={{ position: 'relative', overflow: 'hidden', padding: '78px 20px 72px', borderBottom: '1px solid #1c1c22' }}>
        <div className="scan-beam" />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div className="fade-up">
            <div className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', border: '1px solid #ff1e38', background: 'rgba(255,30,56,0.08)', fontSize: 11, color: '#ff1e38', marginBottom: 18 }}>
              <Zap size={12} /> FREE DEEPSEEK (1.5M TOKENS/DAY) · 150% PLAN CAP · STOCK REA MCP
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.1rem)', fontWeight: 900, lineHeight: 1.02, margin: '0 0 18px', letterSpacing: '-0.03em' }}>
              ABLITERATED AI.<br />
              <span style={{ color: '#ff1e38' }}>REVERSE ENGINEER</span><br />
              ANYTHING.
            </h1>
            <p style={{ fontSize: 16, color: '#d4d4d8', lineHeight: 1.65, maxWidth: 540, margin: '0 0 28px' }}>
              Connect <strong>GLM 5.3</strong>, <strong>GLM 5.3 Flash</strong>, <strong>DeepSeek</strong>, <strong>Qwen</strong>, and <strong>Kimi Abliterated</strong> APIs in one open-source Desktop IDE, Terminal CLI, and Web Gateway — backed by Supabase, Stripe, and a stock <strong>REA MCP</strong> server that controls your computer and rebuilds anything cleanly.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-red" style={{ padding: '14px 24px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onLaunchApp}>
                Launch Abli IDE &amp; Terminal <ArrowRight size={16} />
              </button>
              <button className="btn-outline" style={{ padding: '14px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onOpenOperator}>
                <Download size={15} color="#ff1e38" /> Enter API Keys to Go Live
              </button>
            </div>
          </div>

          {/* Animated Terminal Simulation */}
          <div className="card-bwr" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 24px 70px rgba(255,30,56,0.14)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #232329', background: '#0e0e12' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff1e38' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3f3f46' }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: '#a1a1aa' }}>abli-code-terminal — rea-mcp + computer-control</span>
            </div>
            <div className="mono" style={{ padding: 20, minHeight: 230, fontSize: 12.5, lineHeight: 1.75, background: '#050505' }}>
              {DEMO_LINES.slice(0, lineIdx).map((l, idx) => (
                <div key={idx} style={{ color: idx === 0 ? '#ff1e38' : idx === DEMO_LINES.length - 1 ? '#ffffff' : '#d4d4d8' }}>{l}</div>
              ))}
              <span style={{ display: 'inline-block', width: 8, height: 15, background: '#ff1e38', marginTop: 6 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Model Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-track mono" style={{ padding: '12px 0', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>
          {[0, 1].map((dup) => (
            <div key={dup} style={{ display: 'flex', gap: 40, paddingRight: 40 }}>
              <span>DEEPSEEK ABLITERATED <span style={{ color: '#22c55e' }}>[FREE · 1.5M/DAY]</span></span>
              <span>GLM 5.3 FLASH ABLITERATED <span style={{ color: '#ff1e38' }}>[PREMIUM]</span></span>
              <span>GLM 5.3 ABLITERATED <span style={{ color: '#ff1e38' }}>[PREMIUM]</span></span>
              <span>QWEN ABLITERATED <span style={{ color: '#ff1e38' }}>[PREMIUM]</span></span>
              <span>KIMI ABLITERATED <span style={{ color: '#ff1e38' }}>[PREMIUM]</span></span>
              <span>STOCK REA MCP + COMPUTER CONTROL <span style={{ color: '#ff1e38' }}>[MIT OPEN SOURCE]</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Models Matrix */}
      <section id="models" style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 20px' }}>
        <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>FREE &amp; PREMIUM MODEL ROSTER</div>
        <h2 style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 28px' }}>Plug Any Abliterated Platform Key. Switch Models Instantly.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {catalog.models.map((m) => (
            <div key={m.slug} className="card-bwr" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: '#a1a1aa' }}>{m.family}</span>
                <span className="mono" style={{ fontSize: 10, padding: '3px 7px', background: m.tier === 'free' ? '#14532d' : '#ff1e38', fontWeight: 800 }}>
                  {m.tier === 'free' ? 'FREE · 1.5M/DAY' : 'PREMIUM'}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>{m.name}</h3>
              <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 14px' }}>{m.description}</p>
              <div className="mono" style={{ fontSize: 11, color: '#d4d4d8', borderTop: '1px solid #1f1f26', paddingTop: 10 }}>
                {m.tier === 'free' ? 'Hard stop at 1,500,000 tokens/day' : `$${m.inputCostPer1M}/1M in · $${m.outputCostPer1M}/1M out`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities: Desktop + Terminal + Stock REA MCP */}
      <section id="rea" style={{ background: '#08080b', borderTop: '1px solid #1c1c22', borderBottom: '1px solid #1c1c22', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>BUILT FOR CLEAN-ROOM REVERSE ENGINEERING</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 28px' }}>Desktop App + Abli Terminal + Stock REA MCP + External MCP Hub</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: Binary, title: 'Stock REA MCP Server', desc: 'Inspect PE/ELF/WASM headers, detect packing entropy, extract URLs/IPC strings, disassemble, and generate clean-room rebuild specs.' },
              { icon: Monitor, title: 'Desktop Computer Control', desc: 'Electron desktop app executes PowerShell, reads/writes files, lists windows, captures screenshots, and drives UI tasks.' },
              { icon: Terminal, title: 'Abli Code Terminal', desc: 'Run `npx abli` anywhere for an interactive black-white-red coding & reverse-engineering REPL with live quota meters.' },
              { icon: Code2, title: 'Full MCP Support + Open Source', desc: 'Mount any stdio or Streamable HTTP MCP server alongside stock REA. 100% MIT open source and self-hostable.' }
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card-bwr" style={{ padding: 22 }}>
                  <Icon size={22} color="#ff1e38" style={{ marginBottom: 12 }} />
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 150% Cap Pricing + Stripe Top-Ups */}
      <section id="pricing" style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 20px' }}>
        <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>STRIPE BILLING · 150% HARD SPEND CAP</div>
        <h2 style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 10px' }}>Pay $100, Spend Up to $150 (150%) — Then Hard Stop Until Upgrade or Top-Up.</h2>
        <p style={{ color: '#a1a1aa', margin: '0 0 32px', maxWidth: 720 }}>
          Zero surprise bills. Every paid tier enforces a hard 150% spend ceiling. Need more headroom mid-month? Top up credits anytime via Stripe.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {catalog.plans.map((p) => (
            <div key={p.id} className="card-bwr" style={{ padding: 24, borderColor: p.id === 'max' ? '#ff1e38' : undefined, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: '#ff1e38', fontWeight: 800, marginBottom: 8 }}>{p.badge}</div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{p.name}</h3>
                <div style={{ fontSize: 34, fontWeight: 900, margin: '10px 0' }}>${p.priceUsd}<span style={{ fontSize: 13, color: '#a1a1aa' }}>/mo</span></div>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 18px' }}>{p.tagline}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'grid', gap: 8, fontSize: 13 }}>
                  {p.features.map((feat) => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={14} color="#ff1e38" /> <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className={p.id === 'max' ? 'btn-red' : 'btn-outline'} style={{ width: '100%', padding: '12px', fontSize: 13 }} onClick={() => handlePlanSelect(p.id)}>
                {p.priceUsd === 0 ? 'Start Free (1.5M/day)' : `Subscribe ${p.name} ($${p.spendCapUsd} Cap)`}
              </button>
            </div>
          ))}
        </div>

        <div className="card-bwr" style={{ marginTop: 22, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>PAY-AS-YOU-GO STRIPE TOP-UPS</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Hit your 150% cap? Stack non-expiring credits immediately.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {catalog.topUpPacks.map((t) => (
              <button key={t.id} className="btn-outline" style={{ padding: '9px 14px', fontSize: 12, borderColor: '#ff1e38' }} onClick={() => user ? api.topup(t.amountUsd).then((r: any) => r.checkoutUrl ? (window.location.href = r.checkoutUrl) : onLaunchApp()) : onOpenAuth()}>
                <Cpu size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with Legal, Contact Gmail & robots.txt */}
      <footer style={{ borderTop: '1px solid #1c1c22', background: '#08080b', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, fontSize: 12, color: '#a1a1aa' }}>
          <div>
            <strong style={{ color: '#fff' }}>ABLI <span style={{ color: '#ff1e38' }}>CODE</span></strong> · MIT Open Source ·{' '}
            <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#fff', textDecoration: 'underline' }}>
              <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{catalog.contactEmail}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => onOpenLegal('terms')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Terms</button>
            <button onClick={() => onOpenLegal('privacy')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Privacy</button>
            <button onClick={() => onOpenLegal('aup')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>AUP</button>
            <button onClick={() => onOpenLegal('cookies')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Cookies</button>
            <button onClick={onOpenCookiePrefs} style={{ background: 'none', border: 'none', color: '#ff1e38', cursor: 'pointer', fontSize: 12 }}><Lock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Cookie Settings</button>
            <a href="/robots.txt" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa' }}>robots.txt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
