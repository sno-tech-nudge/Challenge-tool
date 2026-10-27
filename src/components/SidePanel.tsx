'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useOverlay, Portal } from './Overlay';

/** Button that slides a panel in from the right. Closes on Esc, the X, or a click on the scrim.
 *  Client components can pass a function as children to get a `close` callback (e.g. to shut the
 *  panel after a successful save). */
export function SidePanel({
  label,
  icon,
  title,
  children,
  triggerClass = 'btn secondary sm',
}: {
  label: string;
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  triggerClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useOverlay(open, close);
  const titleId = React.useId();

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={label}>
        {icon}
        <span className="btn-label">{label}</span>
      </button>
      <Portal>
      <div className="overlay" data-open={open} aria-hidden={!open}>
        <div className="overlay-scrim" onClick={close} />
        <div ref={ref} className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="panel-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="btn secondary sm" onClick={close} aria-label="close panel" data-autofocus>
              <X size={16} strokeLinejoin="miter" strokeLinecap="square" />
              <span className="btn-label">close</span>
            </button>
          </div>
          <div className="panel-body">{typeof children === 'function' ? children(close) : children}</div>
        </div>
      </div>
      </Portal>
    </>
  );
}
