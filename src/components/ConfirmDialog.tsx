'use client';

import React from 'react';
import { useOverlay } from './Overlay';

/** Controlled confirmation dialog. Cancel is focused first so Enter never confirms by accident. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useOverlay(open, onCancel);
  const titleId = React.useId();
  return (
    <div className="overlay" data-open={open} aria-hidden={!open}>
      <div className="overlay-scrim" onClick={onCancel} />
      <div ref={ref} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <div className="small" style={{ color: 'var(--text-secondary)' }}>{body}</div>
        <div className="dialog-actions">
          <button type="button" className="btn secondary" onClick={onCancel} data-autofocus>cancel</button>
          <button type="button" className={`btn${danger ? ' danger' : ''}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
