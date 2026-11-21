import React from 'react';

// Each model family gets its own geometric mark, matching the shapes on the landing page.
// Abli Flash = circle, Abli Coder = square, Lite (stock free models) = ring, everything else = triangle.
export function shapeKind(name: string): 'circle' | 'square' | 'ring' | 'triangle' {
  if (/^Abli Flash/i.test(name)) return 'circle';
  if (/^Abli Coder/i.test(name)) return 'square';
  if (/^Lite /i.test(name)) return 'ring';
  return 'triangle';
}

export function ModelShape({ name, size = 11, color = '#ff2a43' }: { name: string; size?: number; color?: string }) {
  const kind = shapeKind(name);
  const ring = kind === 'ring';
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        boxSizing: 'border-box',
        background: ring ? 'transparent' : color,
        border: ring ? '2px solid ' + color : undefined,
        borderRadius: kind === 'circle' || ring ? '50%' : kind === 'square' ? 2 : 0,
        clipPath: kind === 'triangle' ? 'polygon(50% 0, 0 100%, 100% 100%)' : undefined
      }}
    />
  );
}
