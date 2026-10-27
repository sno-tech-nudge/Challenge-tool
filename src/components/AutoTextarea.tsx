'use client';

import React from 'react';

/** A text box that grows to fit what is in it, so a long sentence is never cut off or hidden behind a
 *  scroll bar. It re-fits when typing, when the window is resized and once the fonts have loaded. */
export function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);

  React.useEffect(() => {
    fit();
    window.addEventListener('resize', fit);
    void document.fonts?.ready.then(fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  return (
    <textarea
      rows={3}
      {...props}
      ref={ref}
      style={{ overflow: 'hidden', resize: 'none', ...props.style }}
      onInput={(e) => {
        fit();
        props.onInput?.(e);
      }}
    />
  );
}
