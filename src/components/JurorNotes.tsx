'use client';

import React from 'react';
import { getNoteAction, saveNoteAction } from '@/lib/actions';

type Status = 'idle' | 'saving' | 'saved' | 'error';

/** A juror's private notes about one organisation. They save by themselves a moment after typing
 *  stops (and when the box loses focus), and only this juror can ever read them. */
export function JurorNotes({ orgId, initial }: { orgId: string; initial: string }) {
  const [text, setText] = React.useState(initial);
  const [status, setStatus] = React.useState<Status>(initial ? 'saved' : 'idle');
  const lastSaved = React.useRef(initial);
  const latest = React.useRef(initial);
  const timer = React.useRef<number | undefined>(undefined);
  const key = `aahaar-note-${orgId}`;
  const keep = (v: string | null) => { try { if (v === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, v); } catch { /* storage unavailable */ } };

  const save = React.useCallback(async () => {
    const value = latest.current;
    if (value === lastSaved.current) return;
    setStatus('saving');
    let res: { ok?: boolean } = {};
    try { res = await saveNoteAction(orgId, value); } catch { /* network error: handled below */ }
    if (res.ok) {
      lastSaved.current = value;
      if (latest.current === value) keep(null);
      setStatus(latest.current === value ? 'saved' : 'saving');
    } else {
      setStatus('error');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(save, 5000); // keep trying until it goes through
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // text typed but not yet saved (a closed tab, a dropped connection) is brought back and saved
  React.useEffect(() => {
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(key); } catch { /* storage unavailable */ }
    if (pending !== null && pending !== initial) {
      setText(pending);
      latest.current = pending;
      void save();
    } else {
      // the page may come from the browser's cache (back button): show what is really saved,
      // unless the juror has already started typing
      void getNoteAction(orgId).then((fresh) => {
        if (latest.current === lastSaved.current && fresh !== latest.current) {
          setText(fresh);
          latest.current = fresh;
          lastSaved.current = fresh;
          setStatus(fresh ? 'saved' : 'idle');
        }
      }).catch(() => undefined);
    }
    const flush = () => { if (latest.current !== lastSaved.current) void saveNoteAction(orgId, latest.current); };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    latest.current = e.target.value;
    keep(e.target.value);
    setStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(save, 900);
  }

  // leaving the page with a pending save: send it now
  React.useEffect(() => () => {
    window.clearTimeout(timer.current);
    if (latest.current !== lastSaved.current) void saveNoteAction(orgId, latest.current);
  }, [orgId]);

  return (
    <section className="card" id="notes">
      <h2>your notes</h2>
      <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>private to you: nobody else can see these. they save automatically and you can edit them any time, before and after your slot.</p>
      <textarea
        id="juror-notes"
        aria-label="your private notes"
        value={text}
        maxLength={5000}
        onChange={onChange}
        onBlur={() => { window.clearTimeout(timer.current); void save(); }}
        placeholder="jot down anything you want to remember about this organisation"
        style={{ width: '100%', minHeight: 120 }}
      />
      <p className="hint notes-status" aria-live="polite">
        {status === 'saving' && 'saving…'}
        {status === 'saved' && 'saved'}
        {status === 'error' && 'could not save. check your connection; your text is still here.'}
      </p>
    </section>
  );
}
