import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';

declare global {
  interface Window {
    Stripe?: any;
  }
}

const LOAD_ERROR = 'Could not load the payment form. Check your connection and try again.';

function loadStripeJs(): Promise<any> {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return new Promise((resolve, reject) => {
    const done = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error(LOAD_ERROR)));
    const existing = document.querySelector('script[data-stripe-js]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', done);
      existing.addEventListener('error', () => reject(new Error(LOAD_ERROR)));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.async = true;
    s.setAttribute('data-stripe-js', '1');
    s.onload = done;
    s.onerror = () => reject(new Error(LOAD_ERROR));
    document.head.appendChild(s);
  });
}

export interface CheckoutRequest {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
  title: string;
}

// Payment form that stays inside Abli Code. Stripe renders the card fields, we own everything around them.
export function CheckoutModal({
  req,
  onClose,
  onComplete
}: {
  req: CheckoutRequest | null;
  onClose: () => void;
  onComplete: (sessionId: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!req) return;
    let checkout: any = null;
    let cancelled = false;
    setError('');
    setLoading(true);
    (async () => {
      try {
        const Stripe = await loadStripeJs();
        const stripe = Stripe(req.publishableKey);
        checkout = await stripe.initEmbeddedCheckout({
          clientSecret: req.clientSecret,
          onComplete: () => onComplete(req.sessionId)
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        checkout.mount(hostRef.current);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || LOAD_ERROR);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.clientSecret]);

  if (!req) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.82)', display: 'grid', placeItems: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(520px, 100%)', maxHeight: '94vh', overflowY: 'auto', background: '#0c0c11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{req.title}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8e8e9c', marginTop: 3 }}>
              <Lock size={12} color="#ff2a43" /> Secure payment. Card details go straight to Stripe.
            </div>
          </div>
          <button onClick={onClose} title="Close" style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,42,67,0.4)', color: '#ff8a97', fontSize: 13 }}>{error}</div>
        )}
        {loading && !error && <div style={{ padding: '28px 6px', fontSize: 13, color: '#8e8e9c' }}>Loading secure payment form</div>}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', display: loading || error ? 'none' : 'block' }}>
          <div ref={hostRef} />
        </div>
      </div>
    </div>
  );
}
