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
    api
      .getAdminConfig()
      .then((d) => {
        setSettings(d.settings || {});
        setProviders(d.providers || []);
        setModels(d.models || []);
      })
      .catch((e) => setStatusMsg(e.message));
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
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

  const inputStyle: React.CSSProperties = {
    padding: '9px 11px',
    background: '#08080b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 12.5,
    outline: 'none'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="pop-in" style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', background: '#0e0e13', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 26, boxShadow: '0 28px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: '#ff2a43', fontWeight: 600, marginBottom: 2 }}>API Keys &amp; Integrations</div>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Connect Model Platforms, Stripe &amp; Supabase</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#131319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={15} color="#ff2a43" /> Model Platforms
            </h3>
            <div style={{ display: 'grid', gap: 9 }}>
              {providers.map((p, idx) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr auto', gap: 8, alignItems: 'center', background: '#09090d', padding: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: p.hasApiKey ? '#4ade80' : '#8e8e9c' }}>{p.hasApiKey ? `Connected (${p.apiKeyMasked})` : 'Not set'}</div>
                  </div>
                  <input
                    placeholder="Base URL"
                    value={p.baseUrl || ''}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, baseUrl: e.target.value };
                      setProviders(next);
                    }}
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder={p.hasApiKey ? 'Leave blank to keep existing key' : `Paste ${p.name} API Key`}
                    value={p.apiKey || ''}
                    onChange={(e) => {
                      const next = [...providers];
                      next[idx] = { ...p, apiKey: e.target.value };
                      setProviders(next);
                    }}
                    style={inputStyle}
                  />
                  <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 11.5 }} onClick={() => handleTest(p)}>
                    <PlugZap size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{testResults[p.id] || 'Test'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#131319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Model Routing</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {models.map((m, idx) => (
                <div key={m.slug} style={{ display: 'grid', gridTemplateColumns: '170px 140px 1fr 70px', gap: 8, alignItems: 'center', background: '#09090d', padding: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{m.name}</span>
                  <select
                    value={m.platform}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, platform: e.target.value };
                      setModels(next);
                    }}
                    style={inputStyle}
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    value={m.upstreamModelId}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, upstreamModelId: e.target.value };
                      setModels(next);
                    }}
                    className="mono"
                    style={{ ...inputStyle, fontSize: 11.5 }}
                  />
                  <span style={{ fontSize: 11, color: m.tier === 'free' ? '#4ade80' : '#ff6b7d', textAlign: 'right', fontWeight: 600 }}>
                    {m.tier.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#131319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={15} color="#ff2a43" /> Stripe, Supabase &amp; Email Verification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="password" placeholder={settings.hasStripeKey ? 'Stripe Secret Key set (blank to keep)' : 'Stripe Secret Key (sk_...)'} value={settings.stripeSecretKey || ''} onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} style={inputStyle} />
              <input type="password" placeholder={settings.hasStripeWebhook ? 'Stripe Webhook Secret set (blank to keep)' : 'Stripe Webhook Secret (whsec_...)'} value={settings.stripeWebhookSecret || ''} onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })} style={inputStyle} />
              <input placeholder="Supabase URL" value={settings.supabaseUrl || ''} onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })} style={inputStyle} />
              <input placeholder="Supabase Publishable Key" value={settings.supabasePublishableKey || ''} onChange={(e) => setSettings({ ...settings, supabasePublishableKey: e.target.value })} style={inputStyle} />
              <input type="password" placeholder={settings.hasResendKey ? 'Resend Key set (blank to keep)' : 'Resend API Key (for 6-digit codes)'} value={settings.resendApiKey || ''} onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })} style={inputStyle} />
              <input placeholder="Contact Email" value={settings.contactEmail || ''} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 12.5, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
            {statusMsg && <><Check size={14} /> {statusMsg}</>}
          </span>
          <button className="btn-red" onClick={handleSave} disabled={saving} style={{ padding: '11px 22px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
