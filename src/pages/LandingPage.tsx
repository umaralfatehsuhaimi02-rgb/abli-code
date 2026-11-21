import React, { useEffect } from 'react';
import { ArrowDown, Download, Github, Globe } from 'lucide-react';
import { CatalogResponse, UserProfile } from '../lib/api';
import { AbliLogo } from '../components/AbliLogo';

const RELEASES_URL = 'https://github.com/umaralfatehsuhaimi02-rgb/abli-code/releases/latest';
const RED = '#ff2a43';
const INK = '#060608';
const PAPER = '#fafafa';
const LINE = 'rgba(255,255,255,0.12)';

const CSS = `
.lp * { box-sizing: border-box; }
.lp a { text-decoration: none; }
.lp .wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
.lp .reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.lp .reveal.in { opacity: 1; transform: none; }
.lp .d1 { transition-delay: .1s; } .lp .d2 { transition-delay: .2s; } .lp .d3 { transition-delay: .3s; }
.lp .hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: 40px; align-items: center; padding: 64px 0 84px; }
.lp .btn { display: inline-flex; align-items: center; gap: 10px; border-radius: 999px; font-weight: 700; font-size: 15px; padding: 16px 28px; cursor: pointer; border: 2px solid transparent; transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease; }
.lp .btn:hover { transform: translateY(-3px); }
.lp .btn-red { background: ${RED}; color: #fff; }
.lp .btn-red:hover { background: #ff4a5e; }
.lp .btn-line { background: transparent; color: ${PAPER}; border-color: ${PAPER}; }
.lp .btn-line:hover { background: ${PAPER}; color: ${INK}; }
.lp .float-a { animation: lpfloat 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.lp .float-b { animation: lpfloat 9s ease-in-out -3s infinite reverse; transform-box: fill-box; transform-origin: center; }
.lp .spin { animation: lpspin 38s linear infinite; transform-box: fill-box; transform-origin: center; }
.lp .spin-r { animation: lpspin 52s linear infinite reverse; transform-box: fill-box; transform-origin: center; }
.lp .strip { overflow: hidden; border-top: 1px solid ${LINE}; border-bottom: 1px solid ${LINE}; background: ${PAPER}; color: ${INK}; }
.lp .strip-track { display: flex; width: max-content; animation: lpmarq 38s linear infinite; }
.lp .strip:hover .strip-track { animation-play-state: paused; }
.lp .strip span { font-size: 30px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; padding: 18px 0; white-space: nowrap; }
.lp .row { display: grid; grid-template-columns: 90px 1.3fr 1fr 1fr; gap: 20px; align-items: center; padding: 26px 8px; border-bottom: 1px solid ${LINE}; position: relative; transition: padding .35s ease, background .35s ease; }
.lp .row:hover { padding-left: 26px; background: rgba(255,255,255,0.03); }
.lp .row::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: ${RED}; transition: width .35s ease; }
.lp .row:hover::before { width: 6px; }
.lp .feat { display: grid; grid-template-columns: 150px 1fr; gap: 36px; align-items: center; padding: 38px 0; border-top: 1px solid ${LINE}; }
.lp .plans { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.lp .plan { border: 1px solid ${LINE}; border-radius: 28px; padding: 30px 26px; display: flex; flex-direction: column; gap: 14px; transition: transform .35s ease, border-color .35s ease; }
.lp .plan:hover { transform: translateY(-6px); border-color: ${RED}; }
.lp .plan.feat-plan { background: ${PAPER}; color: ${INK}; border-color: ${PAPER}; }
.lp .plan.feat-plan:hover { border-color: ${RED}; }
.lp .navlink { color: #b3b3c0; font-size: 14px; transition: color .2s ease; }
.lp .navlink:hover { color: ${PAPER}; }
.lp .foot-btn { background: none; border: none; color: #d4d4de; cursor: pointer; font-size: 13px; padding: 0; }
@keyframes lpfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes lpspin { to { transform: rotate(360deg); } }
@keyframes lpmarq { to { transform: translateX(-50%); } }
@media (max-width: 900px) {
  .lp .hero { grid-template-columns: 1fr; padding-top: 36px; }
  .lp .row { grid-template-columns: 1fr 1fr; }
  .lp .feat { grid-template-columns: 1fr; gap: 18px; }
  .lp .plans { grid-template-columns: 1fr 1fr; }
  .lp .hide-sm { display: none; }
}
@media (max-width: 560px) { .lp .plans { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) {
  .lp .reveal { opacity: 1; transform: none; transition: none; }
  .lp .float-a, .lp .float-b, .lp .spin, .lp .spin-r, .lp .strip-track { animation: none; }
}
`;

function HeroArt() {
  return (
    <svg viewBox="0 0 480 480" width="100%" style={{ maxWidth: 520, display: 'block', margin: '0 auto' }} role="img" aria-label="Abstract geometric artwork">
      <circle className="spin-r" cx="240" cy="240" r="214" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 11" />
      <circle cx="240" cy="240" r="150" fill={RED} />
      <g className="float-a">
        <rect x="92" y="96" width="150" height="150" rx="34" fill={PAPER} />
      </g>
      <g className="float-b">
        <path d="M300 392 L390 232 L450 392 Z" fill={INK} stroke={PAPER} strokeWidth="4" strokeLinejoin="round" />
      </g>
      <g className="spin">
        <circle cx="380" cy="96" r="46" fill="none" stroke={PAPER} strokeWidth="12" />
      </g>
      <path d="M60 372 A92 92 0 0 1 152 280 L152 372 Z" fill={PAPER} />
      <rect x="196" y="330" width="88" height="18" rx="9" fill={RED} />
      <rect x="196" y="362" width="56" height="18" rx="9" fill={PAPER} />
      <path d="M132 196 L168 120 L204 196" fill="none" stroke={INK} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppPreview() {
  const threads = ['Parser refactor', 'API migration', 'Build script', 'Test failures'];
  return (
    <div style={{ borderRadius: 26, border: `1px solid ${LINE}`, background: '#0d0d12', overflow: 'hidden', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: RED }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3a44' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3a44' }} />
        <span style={{ marginLeft: 12, fontSize: 12.5, color: '#8e8e9c' }}>Abli Code</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 330 }}>
        <div className="hide-sm" style={{ borderRight: `1px solid ${LINE}`, padding: 16, display: 'grid', gap: 6, alignContent: 'start' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#71717e', margin: '4px 8px 8px' }}>Threads</div>
          {threads.map((t, i) => (
            <div key={t} style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13.5, background: i === 0 ? 'rgba(255,42,67,0.14)' : 'transparent', color: i === 0 ? PAPER : '#a8a8b6' }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ justifySelf: 'end', maxWidth: '78%', background: '#1b1b23', borderRadius: '20px 20px 6px 20px', padding: '13px 17px', fontSize: 14, lineHeight: 1.55 }}>
            Make this parser stream the input instead of loading the whole file into memory.
          </div>
          <div style={{ justifySelf: 'start', maxWidth: '82%', background: 'rgba(255,42,67,0.10)', border: '1px solid rgba(255,42,67,0.28)', borderRadius: '20px 20px 20px 6px', padding: '13px 17px', fontSize: 14, lineHeight: 1.6, color: '#e8e8ee' }}>
            Switching to a line reader with a fixed buffer. I will keep the public API the same and update the three call sites that assumed a full string.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, padding: '8px 14px', borderRadius: 999, border: `1px solid ${LINE}`, color: '#c4c4d0' }}>Model: GLM 5.3 (Abliterated)</span>
            <span style={{ fontSize: 12.5, padding: '8px 14px', borderRadius: 999, border: `1px solid ${LINE}`, color: '#c4c4d0' }}>2 MCP servers on</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Glyph({ kind }: { kind: number }) {
  const shapes = [
    <svg key="a" viewBox="0 0 100 100" width="110" height="110"><rect x="6" y="6" width="88" height="88" rx="24" fill={RED} /><circle cx="50" cy="50" r="20" fill={INK} /></svg>,
    <svg key="b" viewBox="0 0 100 100" width="110" height="110"><circle cx="50" cy="50" r="42" fill="none" stroke={PAPER} strokeWidth="10" /><circle cx="50" cy="50" r="14" fill={RED} /></svg>,
    <svg key="c" viewBox="0 0 100 100" width="110" height="110"><path d="M50 8 L94 90 L6 90 Z" fill={PAPER} strokeLinejoin="round" /><rect x="36" y="60" width="28" height="12" rx="6" fill={RED} /></svg>,
    <svg key="d" viewBox="0 0 100 100" width="110" height="110"><path d="M8 92 A84 84 0 0 1 92 8 L92 92 Z" fill={RED} /><circle cx="68" cy="68" r="14" fill={PAPER} /></svg>
  ];
  return shapes[kind % shapes.length];
}

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

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.lp .reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [catalog]);

  const names = catalog.models.map((m) => m.name.replace(' (Abliterated)', ''));
  const strip = [...names, ...names, ...names, ...names];

  const features = [
    { t: 'Threads per project', b: 'Every thread remembers its model, its folder, and its tools, so you can jump between projects without losing context.' },
    { t: 'Switch models mid-chat', b: 'Start on a fast model, move to a flagship when the problem gets hard, and keep the whole conversation.' },
    { t: 'Bring your own MCP servers', b: 'Add stdio or HTTP servers from inside the app and turn them on for the threads that need them.' },
    { t: 'Computer control when you want it', b: 'Off by default. Turn it on for a single thread to run commands, edit files, or take screenshots.' }
  ];

  return (
    <div className="lp" style={{ minHeight: '100vh', background: INK, color: PAPER, overflowX: 'hidden' }}>
      <style>{CSS}</style>

      <header className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
          <AbliLogo size={30} /> Abli Code
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a className="navlink hide-sm" href="#features">Features</a>
          <a className="navlink hide-sm" href="#models">Models</a>
          <a className="navlink hide-sm" href="#pricing">Pricing</a>
          <button className="btn btn-line" onClick={webAction} style={{ padding: '10px 20px', fontSize: 13.5 }}>{user ? 'Open app' : 'Sign in'}</button>
        </nav>
      </header>

      <section className="wrap hero">
        <div>
          <div className="reveal in" style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: RED, border: `1.5px solid ${RED}`, borderRadius: 999, padding: '6px 14px', marginBottom: 26 }}>Open source, MIT licensed</div>
          <h1 className="reveal in d1" style={{ fontSize: 'clamp(2.9rem, 6.2vw, 5.6rem)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 900, margin: '0 0 26px' }}>
            Chat with abliterated models.<br /><span style={{ color: RED }}>One app.</span>
          </h1>
          <p className="reveal in d2" style={{ fontSize: 19, lineHeight: 1.6, color: '#b3b3c0', maxWidth: 500, margin: '0 0 38px' }}>
            The latest open-weight models with refusals removed, from several providers, in a single desktop and web workspace.
          </p>
          <div className="reveal in d3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a className="btn btn-red" href={RELEASES_URL} target="_blank" rel="noreferrer"><Download size={18} /> Download for Windows</a>
            <button className="btn btn-line" onClick={webAction}><Globe size={17} /> Use in browser</button>
          </div>
        </div>
        <div className="reveal in d2"><HeroArt /></div>
      </section>

      <div className="strip" aria-hidden="true">
        <div className="strip-track">
          {strip.map((n, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>{n}<i style={{ display: 'inline-block', width: 16, height: 16, borderRadius: i % 2 ? 0 : '50%', background: RED, margin: '0 34px' }} /></span>
          ))}
        </div>
      </div>

      <section className="wrap" style={{ padding: '110px 28px 40px' }}>
        <div className="reveal" style={{ textAlign: 'center', margin: '0 auto 48px', maxWidth: 620 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 12px' }}>A workspace that stays out of the way</h2>
          <p style={{ color: '#a8a8b6', margin: 0, fontSize: 17, lineHeight: 1.6 }}>Threads on the left, the conversation in the middle, and your model one click away.</p>
        </div>
        <div className="reveal d1"><AppPreview /></div>
      </section>

      <section id="features" className="wrap" style={{ padding: '90px 28px' }}>
        {features.map((f, i) => (
          <div key={f.t} className="feat reveal">
            <Glyph kind={i} />
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.035em' }}>{f.t}</h3>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: '#a8a8b6', maxWidth: 620 }}>{f.b}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="models" className="wrap" style={{ padding: '60px 28px 100px' }}>
        <div className="reveal" style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 10px' }}>Models</h2>
          <p style={{ color: '#a8a8b6', margin: 0, fontSize: 17 }}>Each model shows who serves it and what a million tokens costs.</p>
        </div>
        <div className="reveal d1" style={{ borderTop: `1px solid ${LINE}` }}>
          {catalog.models.map((m, i) => (
            <div key={m.slug} className="row">
              <span style={{ fontSize: 14, fontWeight: 800, color: RED }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.name}</div>
                <div className="hide-sm" style={{ fontSize: 13.5, color: '#8e8e9c', marginTop: 4 }}>{m.description}</div>
              </div>
              <div style={{ fontSize: 14.5, color: '#c4c4d0' }}>{platformName(m.platform)}</div>
              <div style={{ fontSize: 14.5, color: '#c4c4d0', textAlign: 'right' }}>${m.inputCostPer1M} in / ${m.outputCostPer1M} out</div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="wrap" style={{ padding: '40px 28px 110px' }}>
        <div className="reveal" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 10px' }}>Pricing</h2>
          <p style={{ color: '#a8a8b6', margin: 0, fontSize: 17 }}>Pick a plan, or just add credits and pay for what you use.</p>
        </div>
        <div className="plans">
          {catalog.plans.map((p, i) => {
            const featured = p.id === 'pro';
            return (
              <div key={p.id} className={`plan reveal d${(i % 3) + 1}${featured ? ' feat-plan' : ''}`}>
                <svg viewBox="0 0 40 40" width="40" height="40">
                  {i % 4 === 0 && <circle cx="20" cy="20" r="16" fill={RED} />}
                  {i % 4 === 1 && <rect x="4" y="4" width="32" height="32" rx="9" fill={featured ? INK : PAPER} />}
                  {i % 4 === 2 && <path d="M20 3 L37 36 L3 36 Z" fill={featured ? INK : PAPER} strokeLinejoin="round" />}
                  {i % 4 === 3 && <circle cx="20" cy="20" r="14" fill="none" stroke={RED} strokeWidth="7" />}
                </svg>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>{p.name}</div>
                <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>${p.priceUsd}{p.priceUsd ? <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}> /mo</span> : null}</div>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, opacity: 0.78, flex: 1 }}>{p.tagline}</p>
                <div style={{ display: 'grid', gap: 7, fontSize: 14 }}>{p.features.map((f) => <div key={f}>{f}</div>)}</div>
                <button className={featured ? 'btn' : 'btn btn-line'} onClick={onOpenAuth} style={{ justifyContent: 'center', marginTop: 8, padding: '13px 20px', fontSize: 14, ...(featured ? { background: INK, color: PAPER } : {}) }}>
                  {p.priceUsd === 0 ? 'Start free' : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="reveal" style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>Credits</h3>
            <p style={{ margin: 0, fontSize: 16, color: '#a8a8b6', lineHeight: 1.7 }}>
              Top up from $5. A 5% service fee applies, with an $0.80 minimum, and it is shown before you pay. The full credit amount lands in your balance.
            </p>
          </div>
          <div style={{ borderTop: `1px solid ${LINE}` }}>
            {catalog.topUpPacks.map((pk: any) => (
              <div key={pk.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: `1px solid ${LINE}`, fontSize: 16 }}>
                <span style={{ fontWeight: 800 }}>{pk.label}</span>
                <span style={{ color: '#a8a8b6' }}>pay ${pk.totalUsd?.toFixed(2)} (fee ${pk.feeUsd?.toFixed(2)})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: RED, color: '#fff' }}>
        <div className="wrap reveal" style={{ padding: '90px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
          <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.4rem)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.98, margin: 0, maxWidth: 640 }}>Start your first thread today.</h2>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a className="btn" href={RELEASES_URL} target="_blank" rel="noreferrer" style={{ background: INK, color: PAPER }}><Download size={18} /> Download</a>
            <button className="btn" onClick={webAction} style={{ background: PAPER, color: INK }}><ArrowDown size={17} style={{ transform: 'rotate(-90deg)' }} /> {user ? 'Open app' : 'Sign in'}</button>
          </div>
        </div>
      </section>

      <footer className="wrap" style={{ padding: '34px 28px 50px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, fontSize: 13.5, color: '#8e8e9c' }}>
        <span>Abli Code, <a href={`mailto:${catalog.contactEmail}`} style={{ color: '#d4d4de' }}>{catalog.contactEmail}</a></span>
        <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="https://github.com/umaralfatehsuhaimi02-rgb/abli-code" target="_blank" rel="noreferrer" style={{ color: '#d4d4de', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Github size={14} /> Source</a>
          <button className="foot-btn" onClick={() => onOpenLegal('terms')}>Terms</button>
          <button className="foot-btn" onClick={() => onOpenLegal('privacy')}>Privacy</button>
          <button className="foot-btn" onClick={() => onOpenLegal('aup')}>Acceptable use</button>
          <button className="foot-btn" onClick={() => onOpenLegal('cookies')}>Cookies</button>
          <button className="foot-btn" onClick={onOpenCookiePrefs}>Cookie settings</button>
        </span>
      </footer>
    </div>
  );
}
