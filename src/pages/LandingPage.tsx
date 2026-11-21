import React from 'react';
import { Check, Download, Github, Globe, Plug, Shield, Sparkles, Terminal } from 'lucide-react';
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
  const webAction = user ? onLaunchApp : onOpenAuth;
  const platformName = (id: string) => catalog.platforms.find((p) => p.id === id)?.name || id;

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa', overflowX: 'hidden', position: 'relative' }}>
      <div className="orb-primary" style={{ position: 'absolute', top: -220, left: '50%', marginLeft: -420, width: 840, height: 640, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,42,67,0.22), rgba(255,42,67,0))', pointerEvents: 'none' }} />
      <div className="orb-secondary" style={{ position: 'absolute', top: 420, right: -260, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,0.07), rgba(255,255,255,0))', pointerEvents: 'none' }} />

      <header style={{ position: 'relative', zIndex: 2, maxWidth: 1140, margin: '0 auto', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <AbliLogo size={28} /> Abli Code
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14 }}>
          <a href="#models" style={{ color: '#a8a8b6' }}>Models</a>
          <a href="#pricing" style={{ color: '#a8a8b6' }}>Pricing</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: '#a8a8b6', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Github size={15} /> Source</a>
          <button className="btn-outline" onClick={webAction} style={{ padding: '8px 16px', fontSize: 13 }}>{user ? 'Open app' : 'Sign in'}</button>
        </nav>
      </header>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '96px 24px 110px', textAlign: 'center' }}>
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ffb3bc', border: '1px solid rgba(255,42,67,0.35)', background: 'rgba(255,42,67,0.08)', borderRadius: 999, padding: '6px 14px', marginBottom: 26 }}>
          <Sparkles size={13} /> Open source Â· MIT licensed
        </div>
        <h1 className="fade-up" style={{ fontSize: 'clamp(2.8rem, 6.4vw, 5rem)', lineHeight: 1.02, letterSpacing: '-0.045em', fontWeight: 800, margin: '0 0 24px' }}>
          Open-weight models,<br />
          <span style={{ background: 'linear-gradient(90deg, #ff2a43, #ff8a96)', WebkitBackgroundClip: 'text', color: 'transparent' }}>one beautiful workspace.</span>
        </h1>
        <p className="fade-up-delay-1" style={{ fontSize: 18, lineHeight: 1.65, color: '#a8a8b6', margin: '0 auto 40px', maxWidth: 600 }}>
          Abli Code connects the latest abliterated models from several providers. Keep threads per project, switch models mid-conversation, and bring your own MCP servers.
        </p>
        <div className="fade-up-delay-2" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '15px 28px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Download size={17} /> Download for Windows
          </a>
          <button className="btn-outline" onClick={webAction} style={{ padding: '15px 26px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Globe size={16} /> Open in browser
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#71717e', marginTop: 22 }}>No card needed to sign up.</p>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px 110px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {[
            { icon: Terminal, title: 'Threads per project', body: 'Each thread keeps its own model and project folder, so context stays where it belongs.' },
            { icon: Plug, title: 'MCP servers', body: 'Add stdio or HTTP MCP servers from the app, then toggle them per thread.' },
            { icon: Shield, title: 'Computer control, off by default', body: 'Turn it on for one thread when you need commands, files, or screenshots.' },
            { icon: Globe, title: 'Desktop or browser', body: 'The same workspace runs as a Windows app or in any modern browser.' }
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-bwr" style={{ padding: 26 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,42,67,0.12)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                  <Icon size={19} color="#ff2a43" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#9b9ba8' }}>{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="models" style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px 110px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Current models</h2>
          <p style={{ color: '#9b9ba8', margin: 0 }}>Each model shows the provider that serves it and its price per million tokens.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {catalog.models.map((m) => (
            <div key={m.slug} className="card-bwr" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8e8e9c' }}>{m.family}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: m.tier === 'premium' ? 'rgba(255,42,67,0.14)' : 'rgba(255,255,255,0.07)', color: m.tier === 'premium' ? '#ff8a96' : '#c4c4d0', fontWeight: 600 }}>{m.speedBadge || m.tier}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{m.name}</h3>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: '#9b9ba8', flex: 1 }}>{m.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#c4c4d0', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                <span>{platformName(m.platform)}</span>
                <span>${m.inputCostPer1M} / ${m.outputCostPer1M} per 1M</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px 110px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Simple pricing</h2>
          <p style={{ color: '#9b9ba8', margin: 0 }}>Subscribe for a monthly allowance, or add credits when you need more.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {catalog.plans.map((p) => (
            <div key={p.id} className="card-bwr" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: p.id === 'pro' ? 'rgba(255,42,67,0.45)' : undefined }}>
              <div>
                <div style={{ fontSize: 13, color: '#8e8e9c', marginBottom: 6 }}>{p.badge}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{p.name}</h3>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>${p.priceUsd}<span style={{ fontSize: 14, color: '#8e8e9c', fontWeight: 500 }}>{p.priceUsd ? '/mo' : ''}</span></div>
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
        <div className="card-bwr" style={{ marginTop: 18, padding: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 26, alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700 }}>Credits</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#9b9ba8', lineHeight: 1.65 }}>
              Minimum top-up is $5. A 5% service fee applies, with an $0.80 minimum. The fee is shown at checkout, and the full credit amount goes to your balance.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {catalog.topUpPacks.map((pk: any) => (
              <div key={pk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 15px', borderRadius: 13, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{pk.label}</span>
                <span style={{ color: '#9b9ba8' }}>pay ${pk.totalUsd?.toFixed(2)} <span style={{ color: '#71717e' }}>incl. ${pk.feeUsd?.toFixed(2)} fee</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px 110px' }}>
        <div style={{ borderRadius: 28, padding: '64px 36px', textAlign: 'center', background: 'linear-gradient(180deg, #16161e 0%, #0b0b10 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <AbliLogo size={44} />
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', margin: '18px 0 12px' }}>Start in a minute.</h2>
          <p style={{ color: '#9b9ba8', margin: '0 auto 28px', maxWidth: 480, lineHeight: 1.6 }}>Sign in, pick a model, and start a thread. Or download the desktop app and keep everything local.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-red" onClick={webAction} style={{ padding: '14px 26px', fontSize: 15 }}>{user ? 'Open app' : 'Sign in to start'}</button>
            <a className="btn-outline" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '14px 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Download size={16} /> Desktop app</a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px 44px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#8e8e9c' }}>
          <span>Abli Code Â· <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#c4c4d0' }}>{catalog.contactEmail}</a></span>
          <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => onOpenLegal('terms')} style={linkBtn}>Terms</button>
            <button onClick={() => onOpenLegal('privacy')} style={linkBtn}>Privacy</button>
            <button onClick={() => onOpenLegal('aup')} style={linkBtn}>Acceptable use</button>
            <button onClick={() => onOpenLegal('cookies')} style={linkBtn}>Cookies</button>
            <button onClick={onOpenCookiePrefs} style={linkBtn}>Cookie settings</button>
          </span>
        </div>
      </footer>
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13, padding: 0 };

