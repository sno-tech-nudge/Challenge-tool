'use client';

import React from 'react';

/** A small "i" button that explains something in a short note. The note opens on hover (mouse) or on
 *  tap or Enter (touch and keyboard), and closes on Esc or a click anywhere else. */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="infotip" data-open={open} ref={ref}>
      <button type="button" className="infotip-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>i</button>
      <span role="tooltip" className="infotip-pop">{text}</span>
    </span>
  );
}
