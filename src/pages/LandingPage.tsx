import React from 'react';
import { Download, Github, Globe } from 'lucide-react';
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
  const providers = Array.from(new Set(catalog.models.map((m) => catalog.platforms.find((p) => p.id === m.platform)?.name).filter(Boolean)));

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa' }}>
      <header style={{ maxWidth: 1040, margin: '0 auto', padding: '26px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <AbliLogo size={26} /> Abli Code
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14 }}>
          <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: '#a8a8b6', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Github size={15} /> Source</a>
          <button onClick={webAction} style={{ background: 'none', border: 'none', color: '#a8a8b6', cursor: 'pointer', fontSize: 14, padding: 0 }}>{user ? 'Open app' : 'Sign in'}</button>
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '110px 24px 90px', textAlign: 'center' }}>
        <h1 className="fade-up" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.4rem)', lineHeight: 1.05, letterSpacing: '-0.04em', fontWeight: 800, margin: '0 0 22px' }}>
          One app for open-weight models.
        </h1>
        <p className="fade-up-delay-1" style={{ fontSize: 18, lineHeight: 1.6, color: '#a8a8b6', margin: '0 auto 40px', maxWidth: 560 }}>
          Abli Code connects abliterated models from several providers in one desktop app and web workspace. Pick a model, keep your threads, and add your own MCP servers.
        </p>
        <div className="fade-up-delay-2" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ padding: '15px 26px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Download size={17} /> Download for Windows
          </a>
          <button className="btn-outline" onClick={webAction} style={{ padding: '15px 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} /> Use in browser
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#71717e', marginTop: 20 }}>Free plan: 750K tokens a day on each free model.</p>
      </section>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 96px', display: 'grid', gap: 56 }}>
        <div>
          <h2 style={sectionTitle}>Your models, your providers</h2>
          <p style={body}>
            Models run through {providers.join(', ')}. Switch models in the middle of a thread. Each model shows its own price and daily allowance.
          </p>
        </div>
        <div>
          <h2 style={sectionTitle}>Tools when you want them</h2>
          <p style={body}>
            Add any stdio or HTTP MCP server from the app. Turn computer control on for a thread only when you need it, and keep it off otherwise.
          </p>
        </div>
        <div>
          <h2 style={sectionTitle}>Pay for what you use</h2>
          <p style={body}>
            Start free. Subscribe for a larger monthly allowance, or add credits from $5. Credit top-ups carry a 5% service fee with an $0.80 minimum, shown before you pay.
          </p>
        </div>
        <div>
          <h2 style={sectionTitle}>Open source</h2>
          <p style={body}>
            MIT licensed. Read the code, run it yourself, or send a fix. <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ color: '#ff6b7d' }}>View the source</a>.
          </p>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px 44px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#8e8e9c' }}>
          <span>Abli Code · <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#c4c4d0' }}>{catalog.contactEmail}</a></span>
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

const sectionTitle: React.CSSProperties = { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' };
const body: React.CSSProperties = { fontSize: 16, lineHeight: 1.7, color: '#a8a8b6', margin: 0 };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#c4c4d0', cursor: 'pointer', fontSize: 13, padding: 0 };
