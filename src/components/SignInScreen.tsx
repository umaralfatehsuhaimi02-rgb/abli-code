import React from 'react';
import { Code2, Cpu, Zap } from 'lucide-react';
import { AbliLogo } from './AbliLogo';
import { ShapeArt } from './ShapeArt';

const FEATURES = [
  { icon: <Zap size={18} />, title: 'Abli Flash', text: 'Fast abliterated models for everyday chat and quick answers.' },
  { icon: <Code2 size={18} />, title: 'Abli Coder', text: 'Our strongest models for writing, fixing and explaining code.' },
  { icon: <Cpu size={18} />, title: 'Abli Mini', text: 'Run models on your own PC. Private and free, even offline.' }
];

export function SignInScreen({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="signin-screen">
      <div className="signin-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AbliLogo size={38} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>Abli Code</span>
        </div>

        <div>
          <h1 className="signin-title">
            Built for<br />abliterated models<span className="signin-cursor" />
          </h1>
          <p className="signin-sub">One workspace for open-weight chat models, on the web and on your desktop. Start free, upgrade any time.</p>
          <div>
            {FEATURES.map((f) => (
              <div className="signin-feature" key={f.title}>
                <span className="signin-feature-icon">{f.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ShapeArt size={380} />
      </div>

      <div className="signin-right">
        <svg className="signin-deco" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle className="shape-spin" cx="500" cy="150" r="120" fill="none" stroke="rgba(250,250,250,0.10)" strokeWidth="14" strokeDasharray="30 20" />
          <path d="M70 720 L190 520 L310 720 Z" fill="none" stroke="rgba(250,250,250,0.10)" strokeWidth="6" strokeLinejoin="round" />
          <circle className="shape-float" cx="90" cy="170" r="46" fill="#ff2a43" opacity="0.9" />
          <rect className="shape-float" x="470" y="600" width="90" height="90" rx="26" fill="rgba(250,250,250,0.07)" />
        </svg>
        {onBack && (
          <button onClick={onBack} className="signin-back">Back to home</button>
        )}
        <div className="signin-card-wrap">{children}</div>
      </div>
    </div>
  );
}
