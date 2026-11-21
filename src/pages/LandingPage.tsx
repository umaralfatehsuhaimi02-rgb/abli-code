import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, Cpu, CreditCard, FolderGit2,
  Github, KeyRound, Layers, Mail, Monitor, Plug, Shield, Sparkles, Wrench
} from 'lucide-react';
import { api, CatalogResponse, UserProfile } from '../lib/api';
import { AbliLogo } from '../components/AbliLogo';

const PREVIEW_STATES = [
  {
    model: 'DeepSeek V3 Abliterated',
    badge: 'Free · 750K/day',
    tools: ['Workspace Files', 'MCP Tools'],
    prompt: 'Refactor the checkout webhook handler and add idempotency checks.',
    reply: 'Updated server.mjs with Stripe session verification and idempotent state updates.'
  },
  {
    model: 'GLM 5.3 Flash',
    badge: 'Cheap · Fast',
    tools: ['Computer Control', 'MCP Tools'],
    prompt: 'Inspect the build folder, run tests, and fix any TypeScript errors.',
    reply: 'Ran type-check across 14 files, patched 2 type mismatches, and verified dist build.'
  },
  {
    model: 'Kimi K2',
    badge: 'Flagship',
    tools: ['Workspace Files', 'Computer Control', 'Custom MCP'],
    prompt: 'Map the authentication flow across Supabase and the desktop app.',
    reply: 'Mapped OAuth + 6-digit email code routes and synced profile persistence.'
  }
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
  const [previewIdx, setPreviewIdx] = useState(0);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setPreviewIdx((i) => (i + 1) % PREVIEW_STATES.length), 3600);
    return () => clearInterval(timer);
  }, []);

  const handlePlanSelect = async (planId: string) => {
    if (!user) return onOpenAuth();
    setBillingLoading(planId);
    try {
      const res = await api.subscribe(planId);
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
      else onLaunchApp();
    } finally {
      setBillingLoading(null);
    }
  };

  const activePreview = PREVIEW_STATES[previewIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa', position: 'relative', overflowX: 'hidden' }}>
      {/* Ambient Animated Background Orbs */}
      <div
        className="orb-primary"
        style={{
          position: 'fixed',
          top: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,42,67,0.16) 0%, rgba(255,42,67,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        className="orb-secondary"
        style={{
          position: 'fixed',
          bottom: -180,
          left: -140,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Sticky Rounded Glass Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)', background: 'rgba(6,6,8,0.78)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AbliLogo size={30} />
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Abli Code</span>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#b4b4c0' }}>
              Open Source
            </span>
          </a>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13.5 }}>
            <a href="#models" style={{ color: '#c4c4d0' }}>Models</a>
            <a href="#desktop" style={{ color: '#c4c4d0' }}>Desktop App</a>
            <a href="#pricing" style={{ color: '#c4c4d0' }}>Pricing</a>
            <a
              href="https://github.com/umaralfatehsuhaimi02-rgb/abli-code"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c4c4d0' }}
            >
              <Github size={14} /> GitHub
            </a>
            <button className="btn-outline" style={{ padding: '7px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onOpenOperator}>
              <KeyRound size={13} /> API Keys
            </button>
            {user ? (
              <button className="btn-red" style={{ padding: '8px 16px', fontSize: 13 }} onClick={onLaunchApp}>
                Open App
              </button>
            ) : (
              <button className="btn-red" style={{ padding: '8px 16px', fontSize: 13 }} onClick={onOpenAuth}>
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" style={{ position: 'relative', zIndex: 1, padding: '84px 24px 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,42,67,0.1)', border: '1px solid rgba(255,42,67,0.28)', fontSize: 12.5, color: '#ff6b7d', marginBottom: 22 }}>
              <Sparkles size={13} /> Free daily models · Desktop app · MCP tools
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 4.8vw, 4rem)', fontWeight: 800, lineHeight: 1.06, margin: '0 0 20px', letterSpacing: '-0.035em' }}>
              Code with every open model in <span style={{ color: '#ff2a43' }}>one clean workspace.</span>
            </h1>
            <p style={{ fontSize: 16.5, color: '#b4b4c0', lineHeight: 1.65, maxWidth: 520, margin: '0 0 30px' }}>
              Abli Code brings DeepSeek, GLM 5.3, Qwen, and Kimi into a sleek desktop app and web workspace. Switch models anytime, plug in MCP tools, and automate tasks right on your computer.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-red" style={{ padding: '13px 24px', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onLaunchApp}>
                Open Abli Code <ArrowRight size={16} />
              </button>
              <button className="btn-outline" style={{ padding: '13px 22px', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => (user ? onLaunchApp() : onOpenAuth())}>
                Get Started Free
              </button>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 26, fontSize: 12.5, color: '#8e8e9c' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} color="#ff2a43" /> 750K free tokens/day per free model</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} color="#ff2a43" /> MIT Open Source</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} color="#ff2a43" /> Stripe &amp; Supabase ready</span>
            </div>
          </div>

          {/* Interactive Codex-Style Preview Card */}
          <div
            className="fade-up-delay-1"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,27,0.92) 0%, rgba(11,11,15,0.96) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 20,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,42,67,0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AbliLogo size={24} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Abli Code Desktop</span>
              </div>
              <span style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,42,67,0.14)', color: '#ff6b7d', fontWeight: 600 }}>
                {activePreview.badge}
              </span>
            </div>

            {/* Thread Bubble Preview */}
            <div key={previewIdx} className="pop-in" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <div style={{ alignSelf: 'end', justifySelf: 'end', maxWidth: '88%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '11px 15px', fontSize: 13.5, lineHeight: 1.5 }}>
                {activePreview.prompt}
              </div>
              <div style={{ background: 'rgba(255,42,67,0.06)', border: '1px solid rgba(255,42,67,0.2)', borderRadius: 16, padding: '13px 15px', fontSize: 13.5, lineHeight: 1.55, color: '#e4e4ec' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#ff6b7d', marginBottom: 6, fontWeight: 600 }}>
                  <Wrench size={12} /> Used {activePreview.tools.join(' · ')}
                </div>
                {activePreview.reply}
              </div>
            </div>

            {/* Composer Preview Bar */}
            <div style={{ background: '#09090d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: '#71717e', marginBottom: 12 }}>Ask Abli Code to build, edit, or run tools...</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Cpu size={12} color="#ff2a43" /> {activePreview.model} <ChevronDown size={12} color="#8e8e9c" />
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c4c4d0' }}>
                    <Plug size={12} /> + Tools
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PREVIEW_STATES.map((s, idx) => (
                    <button
                      key={s.model}
                      onClick={() => setPreviewIdx(idx)}
                      style={{
                        width: idx === previewIdx ? 18 : 7,
                        height: 7,
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        background: idx === previewIdx ? '#ff2a43' : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.25s ease'
                      }}
                      aria-label={`Preview ${s.model}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smooth Model Ticker */}
      <div className="ticker-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <div className="ticker-track" style={{ padding: '14px 0', fontSize: 13, fontWeight: 500, color: '#b4b4c0' }}>
          {[0, 1].map((dup) => (
            <div key={dup} style={{ display: 'flex', gap: 44, paddingRight: 44 }}>
              <span>DeepSeek V3 <span style={{ color: '#4ade80' }}>· Free 750K/day</span></span>
              <span>GLM 4.5 Flash <span style={{ color: '#4ade80' }}>· Free 750K/day</span></span>
              <span>Qwen3 Coder <span style={{ color: '#4ade80' }}>· Free 750K/day</span></span>
              <span>Llama 3.3 70B <span style={{ color: '#4ade80' }}>· Free 750K/day</span></span>
              <span>GLM 5.3 Flash <span style={{ color: '#ff6b7d' }}>· Cheap &amp; Fast</span></span>
              <span>GLM 5.3 <span style={{ color: '#ffffff' }}>· Flagship</span></span>
              <span>Kimi K2 <span style={{ color: '#ffffff' }}>· 256K Context</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <section id="models" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ maxWidth: 620, marginBottom: 34 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ff2a43' }}>Model Roster</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 10px', letterSpacing: '-0.025em' }}>
            Free daily models, affordable speed, and flagship power.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: '#9b9ba8', lineHeight: 1.6 }}>
            Every free model gets its own 750,000 tokens/day allowance. Switch between free, cheap, and flagship models mid-conversation whenever you want.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {catalog.models.map((m) => (
            <div key={m.slug} className="card-bwr" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#8e8e9c', fontWeight: 500 }}>{m.family}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontWeight: 600,
                    background: m.tier === 'free' ? 'rgba(34,197,94,0.14)' : m.tier === 'cheap' ? 'rgba(255,255,255,0.08)' : 'rgba(255,42,67,0.15)',
                    color: m.tier === 'free' ? '#4ade80' : m.tier === 'cheap' ? '#e4e4ec' : '#ff6b7d'
                  }}
                >
                  {m.speedBadge || (m.tier === 'free' ? 'Free · 750K/day' : m.tier === 'cheap' ? 'Cheap' : 'Flagship')}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{m.name}</h3>
              <p style={{ fontSize: 13.5, color: '#9b9ba8', lineHeight: 1.55, margin: 0 }}>{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop App & Tools Section */}
      <section id="desktop" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '20px 24px 80px' }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(20,20,27,0.7) 0%, rgba(12,12,16,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '44px 32px' }}>
          <div style={{ maxWidth: 600, marginBottom: 32 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ff2a43' }}>Desktop App &amp; Tools</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 10px', letterSpacing: '-0.025em' }}>
              Built like a clean coding companion.
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: '#9b9ba8', lineHeight: 1.6 }}>
              Organize work in threads, attach local project folders, switch models on the fly, and toggle built-in or custom MCP tools without leaving the composer.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: Layers, title: 'Switch Models Anytime', desc: 'Move from DeepSeek Free to GLM 5.3 Flash or Kimi K2 right from the bottom composer bar.' },
              { icon: Plug, title: 'Add Any MCP Tool', desc: 'Toggle built-in workspace, computer, and analysis tools or mount your own stdio & HTTP MCP servers.' },
              { icon: Monitor, title: 'Computer Control', desc: 'Let the desktop app inspect windows, capture screens, run commands, and edit files in your chosen folder.' },
              { icon: FolderGit2, title: 'Open Source Core', desc: 'MIT licensed and self-hostable. Plug in your Supabase, Stripe, and model provider keys in minutes.' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card-bwr" style={{ padding: 22, background: 'rgba(8,8,11,0.75)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,42,67,0.12)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                    <Icon size={18} color="#ff2a43" />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16.5, fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: '#9b9ba8', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section (Normal SaaS Pricing — Cap Undisclosed) */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '20px 24px 88px' }}>
        <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 40px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ff2a43' }}>Pricing</span>
          <h2 style={{ fontSize: 34, fontWeight: 800, margin: '8px 0 10px', letterSpacing: '-0.025em' }}>
            Simple plans. Top up credits anytime.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: '#9b9ba8' }}>
            Start free with daily quotas across multiple models, or upgrade for higher monthly limits and flagship access.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
          {catalog.plans.map((p) => {
            const highlight = p.id === 'pro' || p.id === 'max';
            return (
              <div
                key={p.id}
                className="card-bwr"
                style={{
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderColor: p.id === 'max' ? 'rgba(255,42,67,0.45)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{p.name}</h3>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: highlight ? 'rgba(255,42,67,0.14)' : 'rgba(255,255,255,0.07)', color: highlight ? '#ff6b7d' : '#b4b4c0', fontWeight: 600 }}>
                      {p.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                    ${p.priceUsd}
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#8e8e9c' }}>/month</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#9b9ba8', lineHeight: 1.5, margin: '0 0 20px' }}>{p.tagline}</p>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                    {p.features.map((f) => (
                      <div key={f} style={{ display: 'flex', gap: 9, fontSize: 13, color: '#d4d4de', alignItems: 'flex-start' }}>
                        <Check size={15} color="#ff2a43" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={p.id === 'max' || p.id === 'pro' ? 'btn-red' : 'btn-outline'}
                  style={{ width: '100%', padding: '11px 16px', fontSize: 13.5 }}
                  disabled={billingLoading === p.id}
                  onClick={() => handlePlanSelect(p.id)}
                >
                  {billingLoading === p.id ? 'Opening Checkout...' : p.priceUsd === 0 ? 'Start Free' : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Credit Top-Ups Bar */}
        <div
          style={{
            marginTop: 22,
            padding: '20px 24px',
            borderRadius: 20,
            background: 'rgba(18,18,24,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,42,67,0.12)', display: 'grid', placeItems: 'center' }}>
              <CreditCard size={18} color="#ff2a43" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Need extra usage? Top up credits anytime.</div>
              <div style={{ fontSize: 13, color: '#9b9ba8' }}>Instant Stripe credit packs that never expire and kick in automatically when you hit a limit.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {catalog.topUpPacks.map((pack) => (
              <button
                key={pack.id}
                className="btn-outline"
                style={{ padding: '8px 14px', fontSize: 12.5 }}
                onClick={async () => {
                  if (!user) return onOpenAuth();
                  const r = await api.topup(pack.amountUsd);
                  if (r.checkoutUrl) window.location.href = r.checkoutUrl;
                  else onLaunchApp();
                }}
              >
                {pack.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Footer with Legal & Contact */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '36px 24px 64px', background: 'rgba(5,5,7,0.9)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AbliLogo size={26} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Abli Code</div>
              <div style={{ fontSize: 12.5, color: '#8e8e9c' }}>
                MIT Open Source · Contact:{' '}
                <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#fafafa', textDecoration: 'underline' }}>
                  {catalog.contactEmail}
                </a>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#9b9ba8', alignItems: 'center' }}>
            <button onClick={() => onOpenLegal('terms')} style={{ background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13 }}>Terms</button>
            <button onClick={() => onOpenLegal('privacy')} style={{ background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13 }}>Privacy</button>
            <button onClick={() => onOpenLegal('aup')} style={{ background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13 }}>Acceptable Use</button>
            <button onClick={() => onOpenLegal('cookies')} style={{ background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13 }}>Cookies</button>
            <button onClick={onOpenCookiePrefs} style={{ background: 'none', border: 'none', color: '#ff6b7d', cursor: 'pointer', fontSize: 13 }}>Cookie Settings</button>
            <a href={`mailto:${catalog.contactEmail}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#c4c4d0' }}>
              <Mail size={13} /> Support
            </a>
            <a href="/robots.txt" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#8e8e9c' }}>
              <Shield size={13} /> robots.txt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
