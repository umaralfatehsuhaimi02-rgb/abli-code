import React, { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export interface CookiePrefs {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  savedAt: string;
}

const KEY = 'abli_cookie_consent';

function readCookiePrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CookieBanner({
  forceOpen,
  onCloseForce,
  onOpenCookiePolicy
}: {
  forceOpen?: boolean;
  onCloseForce?: () => void;
  onOpenCookiePolicy: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    if (!readCookiePrefs()) setVisible(true);
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setCustomizing(true);
    }
  }, [forceOpen]);

  const save = (prefs: CookiePrefs) => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=31536000; SameSite=Lax`;
    setVisible(false);
    setCustomizing(false);
    onCloseForce?.();
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 80, maxWidth: 420, width: 'calc(100vw - 32px)', background: '#0b0b0e', border: '1px solid #ff1e38', padding: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.85)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em' }}>
          <Cookie size={16} color="#ff1e38" /> COOKIE CONTROLS
        </div>
        <button onClick={() => { setVisible(false); onCloseForce?.(); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }} aria-label="Dismiss cookie banner">
          <X size={16} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#d4d4d8', margin: '0 0 12px', lineHeight: 1.5 }}>
        Abli Code uses essential cookies for Supabase auth, Stripe checkout state, and 150% quota limits. See our{' '}
        <button onClick={onOpenCookiePolicy} style={{ background: 'none', border: 'none', color: '#ff1e38', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 12 }}>Cookie Policy</button>.
      </p>
      {customizing && (
        <div style={{ borderTop: '1px solid #232329', borderBottom: '1px solid #232329', padding: '10px 0', marginBottom: 12, display: 'grid', gap: 8, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} color="#ff1e38" /> Essential Auth &amp; Security</span>
            <span className="mono" style={{ color: '#a1a1aa' }}>ALWAYS ON</span>
          </div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>Workspace Preferences</span>
            <input type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>Performance Telemetry</span>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-red" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => save({ essential: true, analytics: true, preferences: true, savedAt: new Date().toISOString() })}>Accept All</button>
        <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => save({ essential: true, analytics: false, preferences: false, savedAt: new Date().toISOString() })}>Essential Only</button>
        {!customizing ? (
          <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setCustomizing(true)}>Customize</button>
        ) : (
          <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 12, borderColor: '#ff1e38' }} onClick={() => save({ essential: true, analytics, preferences, savedAt: new Date().toISOString() })}>Save Preferences</button>
        )}
      </div>
    </div>
  );
}
