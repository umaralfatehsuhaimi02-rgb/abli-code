import React from 'react';

export function AbliLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id="abli-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16161c" />
          <stop offset="100%" stopColor="#060608" />
        </linearGradient>
        <linearGradient id="abli-red" x1="20" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff3b53" />
          <stop offset="100%" stopColor="#d90f2b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#abli-bg)" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
      <path d="M21 47L32 17L43 47" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="39" r="4.2" fill="url(#abli-red)" />
    </svg>
  );
}
