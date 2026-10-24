'use client';

import React from 'react';
import { createPortal } from 'react-dom';

/** Draws its children at the top level of the page. Overlays rendered inside a sticky or scrolling
 *  column would otherwise be trapped under the site header and the page banner. */
export function Portal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return ready ? createPortal(children, document.body) : null;
}

/** Shared open/close behaviour for the side panel and the dialog: Esc closes, the page behind stops
 *  scrolling, focus moves in on open and is handed back to whatever opened it, and Tab stays inside. */
export function useOverlay(open: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (el) => !el.hasAttribute('disabled'),
      );
    // wait a frame so the element is visible before taking focus
    const t = requestAnimationFrame(() => (ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
