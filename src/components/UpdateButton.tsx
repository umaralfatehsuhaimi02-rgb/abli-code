import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type UpdateState = { phase: 'idle' | 'available' | 'downloading' | 'installing'; version: string; error?: string };

// Shows only in the desktop app, only when GitHub has a newer release than the one installed.
export function UpdateButton() {
  const api = (window as any).abliDesktop?.update;
  const [st, setSt] = useState<UpdateState>({ phase: 'idle', version: '' });
  useEffect(() => {
    if (!api) return;
    let alive = true;
    api.state().then((s: UpdateState) => { if (alive && s) setSt(s); }).catch(() => {});
    const off = api.onState((s: UpdateState) => { if (alive && s) setSt(s); });
    return () => { alive = false; try { off && off(); } catch {} };
  }, []);
  if (!api || st.phase === 'idle' || !st.version) return null;
  const busy = st.phase === 'downloading' || st.phase === 'installing';
  const label = st.phase === 'downloading' ? 'Downloading v' + st.version + '...' : st.phase === 'installing' ? 'Restarting to update...' : st.error ? 'Retry update to v' + st.version : 'Update to v' + st.version;
  return (
    <div style={{ padding: '6px 10px 2px' }}>
      <button
        disabled={busy}
        onClick={() => { api.install(); }}
        title={st.error ? st.error : 'A new version of Abli Code is ready'}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'var(--red, #ff2547)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.75 : 1 }}
      >
        <Download size={14} />
        {label}
      </button>
    </div>
  );
}
