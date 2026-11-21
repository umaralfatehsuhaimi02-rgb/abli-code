import React from 'react';

const RED = '#ff2a43';
const INK = '#060608';
const PAPER = '#fafafa';

export function ShapeArt({ size = 180 }: { size?: number }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="img" aria-label="Abstract geometric artwork" style={{ display: 'block', margin: '0 auto' }}>
      <circle className="shape-spin" cx="120" cy="120" r="108" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 9" />
      <circle cx="120" cy="120" r="74" fill={RED} />
      <g className="shape-float">
        <rect x="44" y="50" width="76" height="76" rx="18" fill={PAPER} />
      </g>
      <path d="M150 196 L192 118 L226 196 Z" fill={INK} stroke={PAPER} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="190" cy="48" r="22" fill="none" stroke={PAPER} strokeWidth="7" />
      <path d="M30 188 A46 46 0 0 1 76 142 L76 188 Z" fill={PAPER} />
      <rect x="98" y="164" width="44" height="10" rx="5" fill={RED} />
      <rect x="98" y="182" width="28" height="10" rx="5" fill={PAPER} />
      <path d="M66 98 L84 60 L102 98" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
