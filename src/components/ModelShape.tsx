import React from 'react';

// Each model family gets its own geometric mark, matching the shapes on the landing page.
// Flash = circle, Coder = square, everything else = triangle.
export function shapeKind(name: string): 'circle' | 'square' | 'triangle' {
  if (/^Abli Flash/i.test(name)) return 'circle';
  if (/^Abli Coder/i.test(name)) return 'square';
  return 'triangle';
}

export function ModelShape({ name, size = 11, color = '#ff2a43' }: { name: string; size?: number; color?: string }) {
  const kind = shapeKind(name);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        background: color,
        borderRadius: kind === 'circle' ? '50%' : kind === 'square' ? 2 : 0,
        clipPath: kind === 'triangle' ? 'polygon(50% 0, 0 100%, 100% 100%)' : undefined
      }}
    />
  );
}
