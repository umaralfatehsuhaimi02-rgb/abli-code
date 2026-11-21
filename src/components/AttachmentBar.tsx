import React from 'react';
import { FileText, X } from 'lucide-react';
import { Attachment, formatBytes } from '../lib/attachments';

// Chips shown above the composer text box before sending.
export function AttachmentBar({
  items,
  onRemove,
  note
}: {
  items: Attachment[];
  onRemove: (id: string) => void;
  note?: string;
}) {
  if (items.length === 0 && !note) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {items.map((a) => (
          <div
            key={a.id}
            className="att-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: a.kind === 'image' ? 4 : '6px 10px 6px 8px',
              paddingRight: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              maxWidth: 230
            }}
          >
            {a.kind === 'image' && a.dataUrl ? (
              <img src={a.dataUrl} alt={a.name} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
            ) : (
              <FileText size={15} color="#ff2a43" />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#e4e4ec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{a.name}</div>
              <div style={{ fontSize: 10.5, color: '#71717e' }}>{formatBytes(a.size)}{a.truncated ? ' (first 150 KB)' : ''}</div>
            </div>
            <button
              onClick={() => onRemove(a.id)}
              title="Remove"
              className="sb-icon-btn"
              style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: '#9b9ba8', cursor: 'pointer' }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      {note && <div style={{ marginTop: 8, fontSize: 11.5, color: '#ff8a98' }}>{note}</div>}
    </div>
  );
}

// Attachments shown inside a sent message bubble.
export function MessageAttachments({ items }: { items: Attachment[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {items.map((a) =>
        a.kind === 'image' && a.dataUrl ? (
          <img key={a.id} src={a.dataUrl} alt={a.name} style={{ maxWidth: 220, maxHeight: 180, borderRadius: 12, display: 'block', objectFit: 'cover' }} />
        ) : (
          <span
            key={a.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', fontSize: 12, color: '#d4d4de' }}
          >
            <FileText size={13} color="#ff2a43" /> {a.name}
          </span>
        )
      )}
    </div>
  );
}
