import React, { useState } from 'react';
import { CheckCircle2, Github, Mail, Shield, X } from 'lucide-react';
import { api, setToken, UserProfile } from '../lib/api';

export function AuthModal({ open, onClose, onAuthed }: { open: boolean; onClose: () => void; onAuthed: (u: UserProfile) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  if (!open) return null;

  const handleSendCode = async () => {
    setErr(''); setInfo(''); setLoading(true);
    try {
      const res = await api.sendCode(email, 'signup');
      setCodeSent(true);
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
        setInfo(`6-digit verification code generated (Preview: ${res.previewCode}). Add a Resend API key in Operator Setup for live inbox delivery.`);
      } else {
        setInfo('6-digit verification code sent to your email.');
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = mode === 'signup'
        ? await api.register({ email, password, name, code })
        : await api.login({ email, password });
      setToken(res.token);
      onAuthed(res.user);
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setErr('');
    try {
      const res = await api.getOAuthUrl(provider);
      window.location.href = res.url;
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#0b0b0e', border: '1px solid #26262d', padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={18} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ width: 10, height: 10, background: '#ff1e38', display: 'inline-block' }} />
          <span className="mono" style={{ fontSize: 12, color: '#ff1e38', fontWeight: 700 }}>SUPABASE AUTH + 6-DIGIT CODE</span>
        </div>
        <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 900 }}>{mode === 'signup' ? 'Create Abli Code Account' : 'Sign In to Abli Code'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <button className="btn-outline" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }} onClick={() => handleOAuth('github')}>
            <Github size={16} /> GitHub OAuth
          </button>
          <button className="btn-outline" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }} onClick={() => handleOAuth('google')}>
            <Shield size={16} color="#ff1e38" /> Google OAuth
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setMode('signup'); setErr(''); }} style={{ flex: 1, padding: '8px', background: mode === 'signup' ? '#ff1e38' : '#121217', color: '#fff', border: '1px solid #26262d', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>REGISTER (6-DIGIT CODE)</button>
          <button onClick={() => { setMode('login'); setErr(''); }} style={{ flex: 1, padding: '8px', background: mode === 'login' ? '#ff1e38' : '#121217', color: '#fff', border: '1px solid #26262d', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>PASSWORD LOGIN</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '10px 12px', background: '#050505', border: '1px solid #27272e', color: '#fff' }} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ flex: 1, padding: '10px 12px', background: '#050505', border: '1px solid #27272e', color: '#fff' }} />
            {mode === 'signup' && (
              <button type="button" className="btn-outline" disabled={loading || !email.includes('@')} onClick={handleSendCode} style={{ padding: '0 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{codeSent ? 'Resend' : 'Send Code'}
              </button>
            )}
          </div>
          {mode === 'signup' && (
            <div style={{ display: 'grid', gap: 6 }}>
              <input placeholder="6-Digit Verification Code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required className="mono" style={{ padding: '10px 12px', background: '#050505', border: '1px solid #ff1e38', color: '#fff', letterSpacing: '0.25em', fontWeight: 700 }} />
              {previewCode && (
                <button type="button" onClick={() => setCode(previewCode)} style={{ background: '#141418', border: '1px dashed #ff1e38', color: '#fff', padding: '6px 10px', fontSize: 11, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#ff1e38" /> Autofill verification code: <strong className="mono">{previewCode}</strong>
                </button>
              )}
            </div>
          )}
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px 12px', background: '#050505', border: '1px solid #27272e', color: '#fff' }} />

          {info && <div style={{ fontSize: 12, color: '#e4e4e7', background: '#141418', padding: 10, borderLeft: '3px solid #ff1e38' }}>{info}</div>}
          {err && <div style={{ fontSize: 12, color: '#ff4d61', background: '#1d0b0e', padding: 10, border: '1px solid #ff1e38' }}>{err}</div>}

          <button type="submit" className="btn-red" disabled={loading} style={{ padding: '12px', fontSize: 14 }}>
            {loading ? 'Processing...' : mode === 'signup' ? 'Verify Code & Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
