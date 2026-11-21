import React from 'react';

const RED = '#ff2a43';
const INK = '#060608';
const PAPER = '#fafafa';

// Four shapes in a clean row: circle, logo square, triangle, ring. Nothing overlaps.
export function ShapeArt({ size = 380 }: { size?: number }) {
  return (
    <svg viewBox="0 0 420 100" width={size} height={(size * 100) / 420} role="img" aria-label="Abstract geometric artwork" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx="50" cy="50" r="44" fill={RED} />
      <g className="shape-float">
        <rect x="118" y="8" width="84" height="84" rx="24" fill={PAPER} />
        <path d="M138 72 L160 28 L182 72" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="148" y="58" width="24" height="8" rx="4" fill={RED} />
      </g>
      <path d="M268 10 L312 90 L224 90 Z" fill="none" stroke={PAPER} strokeWidth="5" strokeLinejoin="round" />
      <circle className="shape-spin" cx="366" cy="50" r="38" fill="none" stroke={PAPER} strokeWidth="10" strokeDasharray="22 14" />
    </svg>
  );
}
