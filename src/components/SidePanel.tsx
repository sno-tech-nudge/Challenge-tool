'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useOverlay } from './Overlay';

/** Button that slides a panel in from the right. Closes on Esc, the X, or a click on the scrim. */
export function SidePanel({ label, icon, title, children }: { label: string; icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useOverlay(open, close);
  const titleId = React.useId();

  return (
    <>
      <button type="button" className="btn secondary" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        {icon}
        <span className="btn-label">{label}</span>
      </button>
      <div className="overlay" data-open={open} aria-hidden={!open}>
        <div className="overlay-scrim" onClick={close} />
        <div ref={ref} className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="panel-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="btn ghost sm" onClick={close} aria-label="close panel" data-autofocus>
              <X size={18} strokeLinejoin="miter" strokeLinecap="square" />
            </button>
          </div>
          <div className="panel-body">{children}</div>
        </div>
      </div>
    </>
  );
}
