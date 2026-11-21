import React, { useState } from 'react';
import { CheckCircle2, Github, Mail, Shield, X } from 'lucide-react';
import { GoogleLogo } from './GoogleLogo';
import { api, setToken, UserProfile } from '../lib/api';
import { AbliLogo } from './AbliLogo';

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
    setErr('');
    setInfo('');
    setLoading(true);
    try {
      const res: any = await api.sendCode(email, 'signup');
      setCodeSent(true);
      const devCode = res.devPreviewCode || res.previewCode;
      if (devCode) {
        setPreviewCode(devCode);
        setInfo(`Verification code generated (${devCode}). Add a Resend key in API Keys for live inbox delivery.`);
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
    setErr('');
    setLoading(true);
    try {
      const res =
        mode === 'signup'
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
      const res = await api.getOAuthUrl(provider, `${window.location.origin}/#/app`);
      window.location.href = res.url;
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '11px 14px',
    background: '#08080b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13.5,
    outline: 'none'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="pop-in" style={{ width: '100%', maxWidth: 440, background: '#0e0e13', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 28, position: 'relative', boxShadow: '0 24px 70px rgba(0,0,0,0.65)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#8e8e9c', cursor: 'pointer' }}><X size={18} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <AbliLogo size={26} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9b9ba8' }}>Abli Code Account</span>
        </div>
        <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <button className="btn-outline" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, borderRadius: 12 }} onClick={() => handleOAuth('github')}>
            <Github size={15} /> GitHub
          </button>
          <button className="btn-outline" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, borderRadius: 12 }} onClick={() => handleOAuth('google')}>
            <GoogleLogo size={16} /> Google
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#08080b', padding: 4, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => { setMode('signup'); setErr(''); }} style={{ flex: 1, padding: '8px', borderRadius: 10, background: mode === 'signup' ? '#ff2a43' : 'transparent', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12.5 }}>
            Sign up
          </button>
          <button onClick={() => { setMode('login'); setErr(''); }} style={{ flex: 1, padding: '8px', borderRadius: 10, background: mode === 'login' ? '#ff2a43' : 'transparent', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12.5 }}>
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 11 }}>
          {mode === 'signup' && (
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
            {mode === 'signup' && (
              <button type="button" className="btn-outline" disabled={loading || !email.includes('@')} onClick={handleSendCode} style={{ padding: '0 14px', fontSize: 12.5, whiteSpace: 'nowrap', borderRadius: 12 }}>
                <Mail size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{codeSent ? 'Resend' : 'Send code'}
              </button>
            )}
          </div>
          {mode === 'signup' && (
            <div style={{ display: 'grid', gap: 6 }}>
              <input placeholder="6-digit verification code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required className="mono" style={{ ...inputStyle, borderColor: 'rgba(255,42,67,0.45)', letterSpacing: '0.22em', fontWeight: 600 }} />
              {previewCode && (
                <button type="button" onClick={() => setCode(previewCode)} style={{ background: 'rgba(255,42,67,0.08)', border: '1px dashed rgba(255,42,67,0.4)', borderRadius: 10, color: '#fff', padding: '7px 11px', fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#ff2a43" /> Use code: <strong className="mono">{previewCode}</strong>
                </button>
              )}
            </div>
          )}
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

          {info && <div style={{ fontSize: 12, color: '#e4e4ec', background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10 }}>{info}</div>}
          {err && <div style={{ fontSize: 12, color: '#ff8a97', background: 'rgba(255,42,67,0.12)', padding: 10, borderRadius: 10, border: '1px solid rgba(255,42,67,0.35)' }}>{err}</div>}

          <button type="submit" className="btn-red" disabled={loading} style={{ padding: '12px', fontSize: 14, marginTop: 4 }}>
            {loading ? 'Working...' : mode === 'signup' ? 'Verify & Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

