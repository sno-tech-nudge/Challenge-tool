'use client';

import React from 'react';
import { saveNoteAction } from '@/lib/actions';

type Status = 'idle' | 'saving' | 'saved' | 'error';

/** A juror's private notes about one organisation. They save by themselves a moment after typing
 *  stops (and when the box loses focus), and only this juror can ever read them. */
export function JurorNotes({ orgId, initial }: { orgId: string; initial: string }) {
  const [text, setText] = React.useState(initial);
  const [status, setStatus] = React.useState<Status>(initial ? 'saved' : 'idle');
  const lastSaved = React.useRef(initial);
  const latest = React.useRef(initial);
  const timer = React.useRef<number | undefined>(undefined);

  const save = React.useCallback(async () => {
    const value = latest.current;
    if (value === lastSaved.current) return;
    setStatus('saving');
    const res = await saveNoteAction(orgId, value);
    if (res.ok) {
      lastSaved.current = value;
      setStatus(latest.current === value ? 'saved' : 'saving');
    } else setStatus('error');
  }, [orgId]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    latest.current = e.target.value;
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
      <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>private to you: nobody else can see these. they save automatically.</p>
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
