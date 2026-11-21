import React, { useEffect, useState } from 'react';
import { Cpu, Download, HardDrive, Layers, Monitor, RefreshCw, Trash2, X } from 'lucide-react';
import { desktopLocal, LOCAL_MODELS } from '../lib/local';
import { ModelShape } from './ModelShape';

const LEVEL_COLOR: Record<string, string> = {
  great: '#4ade80', good: '#4ade80', ok: '#facc15', slow: '#fb923c', no: '#ff6b7d'
};

function gb(n: number) {
  return n >= 1 ? `${n.toFixed(1)} GB` : `${Math.round(n * 1024)} MB`;
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 150, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', color: '#ff2a43' }}>{icon}{label}</div>
      <div style={{ fontSize: 13, color: '#f2f2f6', marginTop: 4, lineHeight: 1.35, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

export function LocalPanel({ onClose, onUse, releasesUrl }: { onClose: () => void; onUse: (slug: string) => void; releasesUrl: string }) {
  const dl = desktopLocal();
  const [check, setCheck] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [st, setSt] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busyLoad, setBusyLoad] = useState('');

  const runCheck = async () => {
    if (!dl) return;
    setChecking(true);
    setErr('');
    try { setCheck(await dl.check()); } catch (e: any) { setErr(e?.message || 'Could not check this device.'); }
    finally { setChecking(false); }
  };

  useEffect(() => { if (dl) runCheck(); }, []);

  useEffect(() => {
    if (!dl) return;
    let alive = true;
    const tick = async () => {
      try { const s = await dl.status(); if (alive) setSt(s); } catch {}
    };
    tick();
    const t = setInterval(tick, 800);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const shell = (children: React.ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.7)', padding: 16 }} onClick={onClose}>
      <div className="pop-in" onClick={(e) => e.stopPropagation()} style={{ width: 760, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#fff' }}>
              <Cpu size={22} color="#ff2a43" /> Abli Mini
            </div>
            <div style={{ fontSize: 13.5, color: '#9a9aa8', marginTop: 6, maxWidth: 520, lineHeight: 1.5 }}>
              Abliterated 1.58-bit ternary models that run on your own computer. Private, free, and they work offline once installed.
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', borderRadius: 12, width: 34, height: 34, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );

  if (!dl) {
    return shell(
      <div style={{ marginTop: 22, padding: 20, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Abli Mini lives in the desktop app</div>
        <div style={{ fontSize: 13, color: '#9a9aa8', marginTop: 6, lineHeight: 1.5 }}>
          The models run on your computer, so a web browser cannot load them. Install the Abli Code desktop app, then open Abli Mini to see which models your PC can run.
        </div>
        <a href={releasesUrl} target="_blank" rel="noreferrer" className="btn-red" style={{ display: 'inline-block', marginTop: 14, padding: '10px 18px', fontSize: 13, textDecoration: 'none' }}>Get the desktop app</a>
      </div>
    );
  }

  const dev = check?.device;
  const best = check?.models?.find((m: any) => m.id === check.bestId);
  const engine = st?.engine || check?.engine;

  const act = async (fn: () => Promise<any>) => {
    setErr('');
    try { await fn(); } catch (e: any) { setErr(e?.message || 'Something went wrong.'); }
  };

  return shell(
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: '#ff2a43' }}>CAN YOUR DEVICE RUN IT?</div>
        <button onClick={runCheck} disabled={checking} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={13} className={checking ? 'shape-spin' : ''} /> {checking ? 'Checking' : 'Check again'}
        </button>
      </div>

      {!dev && <div style={{ fontSize: 13, color: '#9a9aa8', padding: '14px 2px' }}>Looking at your processor, memory, graphics card and disk...</div>}

      {dev && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip icon={<Cpu size={12} />} label="PROCESSOR" value={`${dev.cpu} (${dev.cores} threads)`} />
            <Chip icon={<Layers size={12} />} label="MEMORY" value={`${dev.ramGb} GB`} />
            <Chip icon={<Monitor size={12} />} label="GRAPHICS" value={dev.gpus?.length ? dev.gpus.map((g: any) => g.name + (g.vramGb ? ` (${g.vramGb} GB)` : '')).join(', ') : 'No dedicated graphics card found'} />
            <Chip icon={<HardDrive size={12} />} label="FREE DISK" value={`${dev.freeDiskGb} GB`} />
          </div>
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: best ? 'rgba(74,222,128,0.08)' : 'rgba(255,107,125,0.1)', border: `1px solid ${best ? 'rgba(74,222,128,0.25)' : 'rgba(255,107,125,0.3)'}`, fontSize: 13.5, color: '#fff', lineHeight: 1.5 }}>
            {best
              ? <><b>Yes.</b> This PC can run up to <b>{best.name}</b>. Replies will use your {engine?.label || 'processor'}.</>
              : <><b>Not yet.</b> This PC does not have enough memory or disk for the smallest model.</>}
          </div>
        </>
      )}

      {err && <div style={{ marginTop: 12, color: '#ff6b7d', fontSize: 13 }}>{err}</div>}
      {st?.error && !err && <div style={{ marginTop: 12, color: '#ff6b7d', fontSize: 13 }}>{st.error}</div>}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {LOCAL_MODELS.map((info) => {
          const r = check?.models?.find((m: any) => m.id === info.id);
          const installed = Boolean(st?.installed?.[info.id]);
          const installingThis = st?.installing === info.id;
          const running = st?.running?.id === info.id;
          const ready = running && st?.running?.ready;
          const pct = st?.progress && st.progress.total > 0 ? Math.min(100, (st.progress.received / st.progress.total) * 100) : 0;
          const engineExtra = engine && !engine.installed ? ` + engine ${engine.mb} MB` : '';
          return (
            <div key={info.id} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  <ModelShape name={info.name} size={12} /> {info.name}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#8e8e9c', padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.07)' }}>{info.size}</span>
                  {ready && <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>Loaded</span>}
                  {running && !ready && <span style={{ fontSize: 11, fontWeight: 700, color: '#facc15' }}>Loading...</span>}
                </div>
                {r && <span style={{ fontSize: 11.5, fontWeight: 700, color: LEVEL_COLOR[r.level], padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>{r.label}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: '#9a9aa8', marginTop: 5 }}>{info.blurb}</div>
              {r && <div style={{ fontSize: 12, color: r.canRun ? '#7d7d8c' : '#ff6b7d', marginTop: 4 }}>{r.reason}</div>}

              {installingThis && st?.progress && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#ff2a43', borderRadius: 999, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#9a9aa8', marginTop: 5 }}>
                    <span>{st.progress.label}</span>
                    <span>{(st.progress.received / 1048576).toFixed(0)} / {(st.progress.total / 1048576).toFixed(0)} MB ({pct.toFixed(0)}%)</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {installingThis ? (
                  <button onClick={() => act(() => dl.cancel())} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
                ) : installed ? (
                  <>
                    <button className="btn-red" onClick={() => { onUse(info.slug); onClose(); }} style={{ padding: '8px 16px', fontSize: 12.5 }}>Use in chat</button>
                    {ready && <button onClick={() => act(() => dl.stop())} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 12.5, cursor: 'pointer' }}>Unload</button>}
                    <button onClick={() => act(() => dl.remove(info.id))} title="Delete from this PC" style={{ padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#9a9aa8', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={14} /></button>
                  </>
                ) : (
                  <button className="btn-red" disabled={!r?.canRun || Boolean(st?.installing)} onClick={() => act(() => dl.install(info.id))} style={{ padding: '8px 16px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={14} /> {r && !r.canRun ? 'Not available on this PC' : `Install (${gb(r?.downloadGb ?? 0)}${engineExtra})`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, color: '#6f6f7d', lineHeight: 1.5 }}>
        The engine and models download once and stay on your computer. Nothing you type in Abli Mini leaves this PC. Speeds depend on your hardware.
      </div>
    </div>
  );
}
