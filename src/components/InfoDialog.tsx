'use client';

import React from 'react';
import { useOverlay, Portal } from './Overlay';

/** A dialog that stays until the person chooses what to do next (unlike the auto-fading popup).
 *  `actions` holds the buttons or links; Esc and the scrim call `onClose`. */
export function InfoDialog({
  open,
  title,
  children,
  actions,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useOverlay(open, onClose);
  const titleId = React.useId();
  return (
    <Portal>
    <div className="overlay" data-open={open} aria-hidden={!open}>
      <div className="overlay-scrim" onClick={onClose} />
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="tick-lg" aria-hidden="true">✓</div>
        <h2 id={titleId}>{title}</h2>
        {children && <div className="small" style={{ color: 'var(--text-secondary)' }}>{children}</div>}
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
    </Portal>
  );
}
