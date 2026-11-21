import React from 'react';
import { ArrowRight, Check, Download, Github, Globe, Plug, Shield, Terminal } from 'lucide-react';
import { CatalogResponse, UserProfile } from '../lib/api';
import { AbliLogo } from '../components/AbliLogo';

const RELEASES_URL = 'https://github.com/umaralfatehsuhaimi02-rgb/abli-code/releases/latest';
const REPO_URL = 'https://github.com/umaralfatehsuhaimi02-rgb/abli-code';

export function LandingPage({
  catalog,
  user,
  onLaunchApp,
  onOpenAuth,
  onOpenLegal,
  onOpenCookiePrefs
}: {
  catalog: CatalogResponse;
  user: UserProfile | null;
  onLaunchApp: () => void;
  onOpenAuth: () => void;
  onOpenOperator?: () => void;
  onOpenLegal: (s: 'terms' | 'privacy' | 'aup' | 'cookies') => void;
  onOpenCookiePrefs: () => void;
}) {
  const platformName = (id: string) => catalog.platforms.find((p) => p.id === id)?.name || id;
  const webAction = user ? onLaunchApp : onOpenAuth;

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(6,6,8,0.8)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <AbliLogo size={28} /> Abli Code
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14 }}>
            <a href="#features" style={{ color: '#b4b4c0' }}>Features</a>
            <a href="#models" style={{ color: '#b4b4c0' }}>Models</a>
            <a href="#pricing" style={{ color: '#b4b4c0' }}>Pricing</a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: '#b4b4c0', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Github size={15} /> Source</a>
            <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }} onClick={webAction}>{user ? 'Open app' : 'Sign in'}</button>
            <a className="btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '9px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Download size={14} /> Download</a>
          </nav>
        </div>
      </header>

      <section id="top" style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 56, alignItems: 'center' }}>
        <div className="fade-up">
          <div style={{ display: 'inline-block', fontSize: 13, color: '#ff6b7d', border: '1px solid rgba(255,42,67,0.3)', borderRadius: 999, padding: '5px 12px', marginBottom: 22 }}>
            Open source Â· MIT licensed
          </div>
          <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 4.2rem)', lineHeight: 1.04, letterSpacing: '-0.035em', fontWeight: 800, margin: '0 0 20px' }}>
            Chat with the models other apps won't run.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#a8a8b6', maxWidth: 520, margin: '0 0 32px' }}>
            Abli Code is a desktop app and web workspace for abliterated open-weight models. Pick a model, ask your question, and get a direct answer. Add MCP servers and let it work in your project folder.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '14px 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <Download size={17} /> Download for Windows
            </a>
            <button className="btn-outline" style={{ padding: '14px 22px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={webAction}>
              <Globe size={16} /> Use in browser <ArrowRight size={15} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#71717e', marginTop: 18 }}>Free plan includes 750K tokens/day on each free model. macOS and Linux builds come from the source repo.</p>
        </div>

        <div className="fade-up-delay-1" style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 20, boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
            <AbliLogo size={20} />
            <span style={{ fontSize: 13, color: '#a8a8b6' }}>GLM 5.3 (Abliterated) · example chat</span>
          </div>
          <div style={{ display: 'grid', gap: 12, fontSize: 14, lineHeight: 1.6 }}>
            <div style={{ alignSelf: 'end', justifySelf: 'end', maxWidth: '82%', background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '10px 14px' }}>
              Refactor the auth flow and show me the risky parts.
            </div>
            <div style={{ maxWidth: '92%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 14px', color: '#d4d4de' }}>
              I read src/auth.ts and the session middleware. The token refresh has no lock, so two tabs can race. Here's a patch that serializes refresh and keeps the old behavior for everything else.
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 88px' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 36px' }}>Everything you need in one app</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {[
            { icon: Terminal, title: 'Threads like Codex', body: 'Separate threads per task, a project folder per thread, and tool calls shown inline.' },
            { icon: Plug, title: 'MCP servers', body: 'Add stdio or HTTP MCP servers from the app and toggle them per thread.' },
            { icon: Shield, title: 'Computer control', body: 'Off by default. Turn it on per thread to run commands, read files, and capture the screen.' },
            { icon: Globe, title: 'Desktop or browser', body: 'The same workspace runs as a Windows desktop app or in your browser.' }
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-bwr" style={{ padding: 24 }}>
                <Icon size={20} color="#ff2a43" style={{ marginBottom: 14 }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 16.5, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#9b9ba8' }}>{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="models" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 88px' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 10px' }}>Models and where they run</h2>
        <p style={{ color: '#9b9ba8', margin: '0 0 30px', maxWidth: 640, lineHeight: 1.6 }}>Each model is served by a named provider. Switch models in the middle of a thread.</p>
        <div className="card-bwr" style={{ padding: 0, overflow: 'hidden' }}>
          {catalog.models.map((m, i) => (
            <div key={m.slug} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 0.7fr', gap: 12, alignItems: 'center', padding: '16px 22px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12.5, color: '#8e8e9c', marginTop: 2 }}>{m.description}</div>
              </div>
              <div style={{ color: '#c4c4d0' }}>{platformName(m.platform)}</div>
              <div style={{ color: '#c4c4d0' }}>{m.contextWindow >= 1000000 ? '1M context' : `${Math.round(m.contextWindow / 1000)}K context`}</div>
              <div style={{ textAlign: 'right', fontSize: 12.5, color: m.tier === 'free' ? '#4ade80' : '#c4c4d0', fontWeight: 600 }}>
                {m.tier === 'free' ? 'Free daily' : `$${m.inputCostPer1M} / $${m.outputCostPer1M} per 1M`}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 88px' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 10px' }}>Pricing</h2>
        <p style={{ color: '#9b9ba8', margin: '0 0 30px', maxWidth: 640, lineHeight: 1.6 }}>Start free. Subscribe for more monthly usage, or add credits whenever you need them.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {catalog.plans.map((p) => (
            <div key={p.id} className="card-bwr" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
                  ${p.priceUsd}<span style={{ fontSize: 14, color: '#8e8e9c', fontWeight: 500 }}>{p.priceUsd ? '/mo' : ''}</span>
                </div>
                <p style={{ fontSize: 13.5, color: '#9b9ba8', margin: '0 0 18px', lineHeight: 1.5 }}>{p.tagline}</p>
                <div style={{ display: 'grid', gap: 9, marginBottom: 22 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#d4d4de' }}><Check size={14} color="#ff2a43" style={{ marginTop: 3, flexShrink: 0 }} />{f}</div>
                  ))}
                </div>
              </div>
              <button className={p.id === 'pro' ? 'btn-red' : 'btn-outline'} style={{ width: '100%', padding: '11px', fontSize: 13.5 }} onClick={onOpenAuth}>
                {p.priceUsd === 0 ? 'Start free' : `Choose ${p.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="card-bwr" style={{ marginTop: 18, padding: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Credits</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#9b9ba8', lineHeight: 1.6 }}>
              Minimum top-up is $5. A service fee of 5% of the credit amount applies, with a minimum of $0.80. The fee is added at checkout, and the full credit amount goes to your balance.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {catalog.topUpPacks.map((pk) => (
              <div key={pk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{pk.label}</span>
                <span style={{ color: '#9b9ba8' }}>pay ${(pk as any).totalUsd?.toFixed(2)} <span style={{ color: '#71717e' }}>(incl. ${(pk as any).feeUsd?.toFixed(2)} fee)</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ borderRadius: 26, padding: '56px 36px', textAlign: 'center', background: 'linear-gradient(180deg, #14141b 0%, #0c0c10 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 12px' }}>Free and open source</h2>
          <p style={{ color: '#9b9ba8', margin: '0 auto 26px', maxWidth: 520, lineHeight: 1.6 }}>Read the code, run it yourself, or send a fix. MIT licensed.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '13px 24px', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Download size={16} /> Download</a>
            <a className="btn-outline" href={REPO_URL} target="_blank" rel="noreferrer" style={{ padding: '13px 22px', fontSize: 14.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Github size={16} /> View source</a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '30px 24px 48px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, alignItems: 'center', fontSize: 13, color: '#8e8e9c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><AbliLogo size={22} /> Abli Code Â· <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#c4c4d0' }}>{catalog.contactEmail}</a></div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => onOpenLegal('terms')} style={linkBtn}>Terms</button>
            <button onClick={() => onOpenLegal('privacy')} style={linkBtn}>Privacy</button>
            <button onClick={() => onOpenLegal('aup')} style={linkBtn}>Acceptable use</button>
            <button onClick={() => onOpenLegal('cookies')} style={linkBtn}>Cookies</button>
            <button onClick={onOpenCookiePrefs} style={linkBtn}>Cookie settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13, padding: 0 };

