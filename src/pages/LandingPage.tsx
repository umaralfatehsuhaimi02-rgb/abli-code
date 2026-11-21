import React from 'react';
import { ArrowUpRight, Download, Github, Globe } from 'lucide-react';
import { CatalogResponse, UserProfile } from '../lib/api';
import { AbliLogo } from '../components/AbliLogo';

const RELEASES_URL = 'https://github.com/umaralfatehsuhaimi02-rgb/abli-code/releases/latest';
const REPO_URL = 'https://github.com/umaralfatehsuhaimi02-rgb/abli-code';

const RULE = '1px solid rgba(255,255,255,0.14)';

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
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa', overflowX: 'hidden' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: RULE }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, letterSpacing: '-0.02em', fontSize: 17 }}>
          <AbliLogo size={26} /> ABLI CODE
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 26, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <a href="#models" style={{ color: '#a8a8b6' }}>Models</a>
          <a href="#pricing" style={{ color: '#a8a8b6' }}>Pricing</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: '#a8a8b6', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Github size={14} /> Source</a>
          <button onClick={webAction} style={{ background: '#fafafa', color: '#060608', border: 'none', padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 0 }}>{user ? 'Open app' : 'Sign in'}</button>
        </nav>
      </header>

      <section style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '72px 28px 96px', borderBottom: RULE, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -90, top: 40, width: 360, height: 360, background: '#ff2a43', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', opacity: 0.95 }} />
        <div style={{ position: 'absolute', right: 210, top: 260, width: 120, height: 120, border: '10px solid #fafafa', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 40, bottom: 40, width: 70, height: 70, background: '#fafafa' }} />
        <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#ff2a43', margin: '0 0 28px', fontWeight: 700 }}>Open source, MIT licensed</p>
        <h1 style={{ fontSize: 'clamp(3.2rem, 8vw, 7.2rem)', lineHeight: 0.92, letterSpacing: '-0.05em', fontWeight: 900, margin: '0 0 30px', maxWidth: 860, textTransform: 'uppercase' }}>
          Open models.<br />One workspace.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: '#b3b3c0', maxWidth: 520, margin: '0 0 40px' }}>
          The latest abliterated models from several providers, in one app. Threads per project, model switching mid-chat, and your own MCP servers.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <a href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ background: '#ff2a43', color: '#fff', padding: '17px 26px', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Download size={17} /> Download for Windows
          </a>
          <button onClick={webAction} style={{ background: 'transparent', color: '#fafafa', border: '2px solid #fafafa', padding: '15px 24px', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Globe size={16} /> Use in browser
          </button>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', borderBottom: RULE }}>
        {[
          { n: '01', t: 'Threads per project', b: 'Each thread keeps its model, folder, and tools. Context stays where it belongs.' },
          { n: '02', t: 'MCP servers', b: 'Add stdio or HTTP servers from the app, then switch them on per thread.' },
          { n: '03', t: 'Computer control', b: 'Off by default. Turn it on for one thread when you need commands, files, or screenshots.' },
          { n: '04', t: 'Desktop or browser', b: 'One workspace in a Windows app or any modern browser.' }
        ].map((f, i) => (
          <div key={f.n} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1.2fr', gap: 24, padding: '34px 28px', borderTop: i === 0 ? 'none' : RULE, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#ff2a43', fontWeight: 800 }}>{f.n}</span>
            <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>{f.t}</h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#a8a8b6' }}>{f.b}</p>
          </div>
        ))}
      </section>

      <section id="models" style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 28px', borderBottom: RULE }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase', lineHeight: 0.95 }}>Current<br />models</h2>
          <p style={{ color: '#a8a8b6', margin: 0, maxWidth: 360, lineHeight: 1.6, fontSize: 15 }}>Each model lists the provider that serves it and its price per million tokens.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', borderTop: RULE, borderLeft: RULE }}>
          {catalog.models.map((m) => (
            <div key={m.slug} style={{ padding: '26px 24px', borderRight: RULE, borderBottom: RULE, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 210 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: m.tier === 'premium' ? '#ff2a43' : '#8e8e9c', fontWeight: 800 }}>
                <span>{m.family}</span>
                <span>{m.speedBadge || m.tier}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.name}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#a8a8b6', flex: 1 }}>{m.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#d4d4de' }}>
                <span>{platformName(m.platform)}</span>
                <span>${m.inputCostPer1M} in, ${m.outputCostPer1M} out</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 28px', borderBottom: RULE }}>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 44px', textTransform: 'uppercase', lineHeight: 0.95 }}>Pricing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', borderTop: RULE, borderLeft: RULE }}>
          {catalog.plans.map((p) => {
            const featured = p.id === 'pro';
            return (
              <div key={p.id} style={{ padding: 28, borderRight: RULE, borderBottom: RULE, background: featured ? '#fafafa' : 'transparent', color: featured ? '#060608' : '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22, minHeight: 380 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: featured ? '#ff2a43' : '#8e8e9c' }}>{p.badge}</div>
                  <h3 style={{ margin: '10px 0 6px', fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em' }}>{p.name}</h3>
                  <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-0.04em' }}>${p.priceUsd}{p.priceUsd ? <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}> /mo</span> : null}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.75, margin: '12px 0 18px' }}>{p.tagline}</p>
                  <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                    {p.features.map((f) => <div key={f}>{f}</div>)}
                  </div>
                </div>
                <button onClick={onOpenAuth} style={{ width: '100%', padding: '13px', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', background: featured ? '#060608' : 'transparent', color: featured ? '#fafafa' : '#fafafa', border: featured ? 'none' : '2px solid #fafafa' }}>
                  {p.priceUsd === 0 ? 'Start free' : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800 }}>Credits</h3>
            <p style={{ margin: 0, fontSize: 15, color: '#a8a8b6', lineHeight: 1.6 }}>
              Minimum top-up is $5. A 5% service fee applies, with an $0.80 minimum. The fee is shown at checkout, and the full credit amount goes to your balance.
            </p>
          </div>
          <div style={{ borderTop: RULE }}>
            {catalog.topUpPacks.map((pk: any) => (
              <div key={pk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: RULE, fontSize: 15 }}>
                <span style={{ fontWeight: 700 }}>{pk.label}</span>
                <span style={{ color: '#a8a8b6' }}>pay ${pk.totalUsd?.toFixed(2)}, fee ${pk.feeUsd?.toFixed(2)} <ArrowUpRight size={14} style={{ verticalAlign: '-2px' }} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '110px 28px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderBottom: RULE }}>
        <div style={{ position: 'absolute', right: 28, bottom: -40, width: 280, height: 280, border: '14px solid #ff2a43', borderRadius: '50%' }} />
        <h2 style={{ fontSize: 'clamp(2.6rem, 6vw, 5.2rem)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.92, margin: '0 0 36px', textTransform: 'uppercase', maxWidth: 760 }}>Start a thread.</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button onClick={webAction} style={{ background: '#fafafa', color: '#060608', border: 'none', padding: '17px 26px', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>{user ? 'Open app' : 'Sign in to start'}</button>
          <a href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ border: '2px solid #fafafa', color: '#fafafa', padding: '15px 24px', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none' }}>Desktop app</a>
        </div>
      </section>

      <footer style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 28px 48px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#8e8e9c' }}>
        <span>Abli Code, <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#d4d4de' }}>{catalog.contactEmail}</a></span>
        <span style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <button onClick={() => onOpenLegal('terms')} style={linkBtn}>Terms</button>
          <button onClick={() => onOpenLegal('privacy')} style={linkBtn}>Privacy</button>
          <button onClick={() => onOpenLegal('aup')} style={linkBtn}>Acceptable use</button>
          <button onClick={() => onOpenLegal('cookies')} style={linkBtn}>Cookies</button>
          <button onClick={onOpenCookiePrefs} style={linkBtn}>Cookie settings</button>
        </span>
      </footer>
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#d4d4de', cursor: 'pointer', fontSize: 13, padding: 0 };

