'use client';

import React from 'react';
import { Portal } from './Overlay';

/** A small "i" button beside a score. Hovering shows the juror's remark in a note headed "remark";
 *  clicking keeps it open (and works on touch). Esc, a click elsewhere or scrolling closes it. The
 *  note is drawn at the top of the page so a scrolling table never clips it. */
export function RemarkTip({ text, juror }: { text: string; juror?: string }) {
  const btn = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const [pinned, setPinned] = React.useState(false);
  const open = pos !== null;

  const show = React.useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(300, window.innerWidth - 16);
    setPos({ top: r.bottom + 8, left: Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8) });
  }, []);
  const hide = React.useCallback(() => {
    setPos(null);
    setPinned(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!btn.current?.contains(e.target as Node)) hide();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open, hide]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="remark-btn"
        aria-label={juror ? `remark from ${juror}` : 'remark'}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={() => !pinned && setPos(null)}
        onFocus={show}
        onBlur={() => !pinned && setPos(null)}
        onClick={() => {
          if (pinned) hide();
          else {
            show();
            setPinned(true);
          }
        }}
      >
        i
      </button>
      {open && (
        <Portal>
          <div role="tooltip" className="remark-pop" style={{ top: pos.top, left: pos.left }}>
            <div className="remark-title">remark</div>
            <div className="pre">{text}</div>
          </div>
        </Portal>
      )}
    </>
  );
}
