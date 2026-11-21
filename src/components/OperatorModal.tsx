import React, { useEffect, useState } from 'react';
import { Check, CreditCard, KeyRound, PlugZap, Save, X } from 'lucide-react';
import { api } from '../lib/api';

export function OperatorModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [settings, setSettings] = useState<any>({});
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.getAdminConfig().then((d) => {
      setSettings(d.settings || {});
      setProviders(d.providers || []);
      setModels(d.models || []);
    }).catch((e) => setStatusMsg(e.message));
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true); setStatusMsg('');
    try {
      const res = await api.saveAdminConfig({ settings, providers, models });
      setStatusMsg(res.message || 'Saved!');
      onSaved();
    } catch (e: any) {
      setStatusMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (p: any) => {
    setTestResults((prev) => ({ ...prev, [p.id]: 'Testing...' }));
    const res = await api.testProvider({ providerId: p.id, apiKey: p.apiKey, baseUrl: p.baseUrl });
    setTestResults((prev) => ({ ...prev, [p.id]: res.message }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', background: '#0b0b0e', border: '1px solid #ff1e38', padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: '#ff1e38', fontWeight: 700 }}>OPERATOR LAUNCHPAD</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Enter Abliterated API Keys, Platforms &amp; Stripe to Go Live</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card-bwr" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><KeyRound size={15} color="#ff1e38" /> Abliterated Model Platforms</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {providers.map((p, idx) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr auto', gap: 8, alignItems: 'center', background: '#050505', padding: 10, border: '1px solid #1f1f26' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: p.hasApiKey ? '#22c55e' : '#a1a1aa' }}>{p.hasApiKey ? `LIVE (${p.apiKeyMasked})` : 'KEY NEEDED'}</div>
                  </div>
                  <input placeholder="Base URL" value={p.baseUrl || ''} onChange={(e) => {
                    const next = [...providers]; next[idx] = { ...p, baseUrl: e.target.value }; setProviders(next);
                  }} style={{ padding: '8px 10px', background: '#0b0b0e', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
                  <input type="password" placeholder={p.hasApiKey ? 'Leave blank to keep existing key' : `Paste ${p.name} API Key`} value={p.apiKey || ''} onChange={(e) => {
                    const next = [...providers]; next[idx] = { ...p, apiKey: e.target.value }; setProviders(next);
                  }} style={{ padding: '8px 10px', background: '#0b0b0e', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
                  <button className="btn-outline" style={{ padding: '7px 10px', fontSize: 11 }} onClick={() => handleTest(p)}>
                    <PlugZap size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{testResults[p.id] || 'Test'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-bwr" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Model-to-Platform Mapping</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {models.map((m, idx) => (
                <div key={m.slug} style={{ display: 'grid', gridTemplateColumns: '170px 130px 1fr 80px', gap: 8, alignItems: 'center', background: '#050505', padding: 8, border: '1px solid #1f1f26' }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{m.name}</span>
                  <select value={m.platform} onChange={(e) => {
                    const next = [...models]; next[idx] = { ...m, platform: e.target.value }; setModels(next);
                  }} style={{ padding: '6px', background: '#0b0b0e', border: '1px solid #27272e', color: '#fff', fontSize: 12 }}>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input value={m.upstreamModelId} onChange={(e) => {
                    const next = [...models]; next[idx] = { ...m, upstreamModelId: e.target.value }; setModels(next);
                  }} className="mono" style={{ padding: '6px 8px', background: '#0b0b0e', border: '1px solid #27272e', color: '#fff', fontSize: 11 }} />
                  <span className="mono" style={{ fontSize: 11, color: m.tier === 'free' ? '#22c55e' : '#ff1e38', textAlign: 'right' }}>{m.tier.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-bwr" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={15} color="#ff1e38" /> Stripe Billing, Supabase &amp; Custom Email Verification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="password" placeholder={settings.hasStripeKey ? 'Stripe Secret Key Set (leave blank to keep)' : 'Stripe Secret Key (sk_live_... or sk_test_...)'} value={settings.stripeSecretKey || ''} onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
              <input type="password" placeholder={settings.hasStripeWebhook ? 'Stripe Webhook Secret Set (leave blank to keep)' : 'Stripe Webhook Secret (whsec_...)'} value={settings.stripeWebhookSecret || ''} onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
              <input placeholder="Supabase URL" value={settings.supabaseUrl || ''} onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
              <input placeholder="Supabase Publishable Key" value={settings.supabasePublishableKey || ''} onChange={(e) => setSettings({ ...settings, supabasePublishableKey: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
              <input type="password" placeholder={settings.hasResendKey ? 'Resend Key Set (leave blank to keep)' : 'Resend API Key (for 6-digit verification emails)'} value={settings.resendApiKey || ''} onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
              <input placeholder="Contact Gmail" value={settings.contactEmail || ''} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} style={{ padding: '8px 10px', background: '#050505', border: '1px solid #27272e', color: '#fff', fontSize: 12 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>{statusMsg && <><Check size={14} /> {statusMsg}</>}</span>
          <button className="btn-red" onClick={handleSave} disabled={saving} style={{ padding: '11px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save & Go Live'}
          </button>
        </div>
      </div>
    </div>
  );
}
