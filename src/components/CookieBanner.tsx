import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  savedAt: string;
}

const CONSENT_KEY = 'abli_cookie_consent_v1';

export function CookieBanner({
  forceOpen,
  onCloseForce,
  onOpenCookiePolicy
}: {
  forceOpen: boolean;
  onCloseForce: () => void;
  onOpenCookiePolicy: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (allowAnalytics: boolean) => {
    const payload: CookieConsent = {
      necessary: true,
      analytics: allowAnalytics,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setVisible(false);
    onCloseForce();
  };

  if (!visible && !forceOpen) return null;

  return (
    <div
      className="pop-in"
      style={{
        position: 'fixed',
        bottom: 18,
        left: 18,
        right: 18,
        maxWidth: 680,
        margin: '0 auto',
        zIndex: 80,
        background: 'rgba(14,14,19,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: '18px 20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.75)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,42,67,0.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Cookie size={17} color="#ff2a43" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Cookies &amp; Local Preferences</div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#a1a1b0', lineHeight: 1.55 }}>
              Abli Code uses essential cookies for sign-in sessions and preferences.{' '}
              <button
                onClick={onOpenCookiePolicy}
                style={{ background: 'none', border: 'none', color: '#ff6b7d', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 12.5 }}
              >
                Cookie Policy
              </button>
            </p>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: '#d4d4de', cursor: 'pointer' }}>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} style={{ accentColor: '#ff2a43' }} />
              Optional usage diagnostics
            </label>
          </div>
        </div>
        <button onClick={() => { setVisible(false); onCloseForce(); }} style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn-outline" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => saveConsent(false)}>
          Essential Only
        </button>
        <button className="btn-red" style={{ padding: '7px 16px', fontSize: 12 }} onClick={() => saveConsent(analytics)}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}
