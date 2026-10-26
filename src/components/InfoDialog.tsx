'use client';

import React from 'react';
import { useOverlay, Portal } from './Overlay';

/** Confetti pieces, laid out once: position, colour, size, fall time and delay differ so it looks scattered. */
const COLOURS = ['var(--accent-600)', 'var(--status-good)', 'var(--status-warn)', 'var(--text-primary)'];
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  x: `${(i * 37 + 7) % 100}%`,
  dx: `${((i * 53) % 90) - 45}px`,
  r: `${((i * 97) % 720) - 360}deg`,
  d: `${((i * 61) % 60) / 100}s`,
  t: `${1.6 + ((i * 29) % 12) / 10}s`,
  c: COLOURS[i % COLOURS.length],
  w: i % 3 === 0 ? 6 : 9,
  h: i % 3 === 0 ? 12 : 8,
}));

/** A dialog that stays until the person chooses what to do next (unlike the auto-fading popup).
 *  `actions` holds the buttons or links; Esc and the scrim call `onClose`. */
export function InfoDialog({
  open,
  title,
  children,
  actions,
  onClose,
  celebrate,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
  /** Big heading with a pop and a burst of confetti, for a thank-you. */
  celebrate?: boolean;
}) {
  const ref = useOverlay(open, onClose);
  const titleId = React.useId();
  return (
    <Portal>
    <div className="overlay" data-open={open} aria-hidden={!open}>
      <div className="overlay-scrim" onClick={onClose} />
      <div ref={ref} className={`dialog${celebrate ? ' celebrating' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {celebrate && (
          <div className="confetti" aria-hidden="true">
            {PIECES.map((p, i) => (
              <i key={i} style={{ '--x': p.x, '--dx': p.dx, '--r': p.r, '--d': p.d, '--t': p.t, '--c': p.c, width: p.w, height: p.h } as React.CSSProperties} />
            ))}
          </div>
        )}
        <div className={`tick-lg${celebrate ? ' celebrate' : ''}`} aria-hidden="true">✓</div>
        <h2 id={titleId} className={celebrate ? 'celebrate' : undefined}>{title}</h2>
        {children && <div className="small" style={{ color: 'var(--text-secondary)' }}>{children}</div>}
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
    </Portal>
  );
}
