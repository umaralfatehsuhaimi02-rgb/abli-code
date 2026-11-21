import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';

declare global {
  interface Window {
    Stripe?: any;
  }
}

const LOAD_ERROR = 'Could not load the payment form. Check your connection and try again.';
const SLOW_ERROR = 'The payment form is taking too long to load. Check your connection and try again.';

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

function loadStripeJs(): Promise<any> {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return withTimeout(new Promise((resolve, reject) => {
    // A script tag from an earlier failed attempt would never fire again, so always start from a fresh one.
    document.querySelectorAll('script[data-stripe-js]').forEach((n) => n.remove());
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.async = true;
    s.setAttribute('data-stripe-js', '1');
    s.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error(LOAD_ERROR)));
    s.onerror = () => reject(new Error(LOAD_ERROR));
    document.head.appendChild(s);
  }), 15000, SLOW_ERROR);
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
  onComplete: (sessionId: string) => void | Promise<void>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!req) return;
    let checkout: any = null;
    let cancelled = false;
    setError('');
    setLoading(true);
    setConfirming(false);
    (async () => {
      try {
        const Stripe = await loadStripeJs();
        const stripe = Stripe(req.publishableKey);
        checkout = await withTimeout(
          stripe.initEmbeddedCheckout({
            clientSecret: req.clientSecret,
            onComplete: async () => {
              setConfirming(true);
              try { await onComplete(req.sessionId); } finally { setConfirming(false); }
            }
          }),
          25000,
          SLOW_ERROR
        );
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
  }, [req?.clientSecret, attempt]);

  if (!req) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.82)', display: 'grid', placeItems: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(520px, 100%)', maxHeight: '94vh', overflowY: 'auto', background: '#0c0c11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 18 }}
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
          <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,42,67,0.4)', color: '#ff8a97', fontSize: 13 }}>
            {error}
            <div style={{ marginTop: 10 }}>
              <button className="btn-red" onClick={() => setAttempt((n) => n + 1)} style={{ padding: '8px 16px', fontSize: 12.5 }}>Try again</button>
            </div>
          </div>
        )}
        {loading && !error && <div style={{ padding: '28px 6px', fontSize: 13, color: '#8e8e9c' }}>Loading secure payment form</div>}
        {/* The form box stays in the layout while Stripe loads, so Stripe can measure it. */}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', height: loading || error ? 0 : 'auto', visibility: loading || error ? 'hidden' : 'visible' }}>
          <div ref={hostRef} />
        </div>

        {confirming && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'rgba(12,12,17,0.94)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Confirming your payment</div>
              <div style={{ fontSize: 12.5, color: '#9a9aa8', marginTop: 6 }}>This takes a few seconds. Keep this window open.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
