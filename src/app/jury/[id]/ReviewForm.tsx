'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { submitReviewAction, clearReviewAction, type FormState } from '@/lib/actions';
import { PARAMETERS, type ScoreEntry } from '@/lib/rubric';
import { JURY_MAX } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InfoDialog } from '@/components/InfoDialog';

function Submit({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn" disabled={pending || disabled}>{pending ? 'saving…' : label}</button>;
}

export function ReviewForm({ orgId, existing }: { orgId: string; existing: ScoreEntry[] }) {
  const toast = useToast();
  const router = useRouter();
  const [state, action] = useFormState<FormState, FormData>(submitReviewAction, {});
  const byKey = new Map(existing.map((e) => [e.key, e]));
  const initialScores = Object.fromEntries(PARAMETERS.map((p) => [p.key, byKey.has(p.key) ? String(byKey.get(p.key)!.score) : '']));
  const [scores, setScores] = React.useState<Record<string, string>>(initialScores);
  const initialRemarks = Object.fromEntries(PARAMETERS.map((p) => [p.key, byKey.get(p.key)?.remarks ?? '']));
  const [remarks, setRemarks] = React.useState<Record<string, string>>(initialRemarks);
  const [dirty, setDirty] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  // every submit goes through a summary dialog first; confirming re-submits the form once
  const formRef = React.useRef<HTMLFormElement>(null);
  const confirmed = React.useRef(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [thanksOpen, setThanksOpen] = React.useState(false);

  const filled = PARAMETERS.filter((p) => scores[p.key] !== '').length;
  const total = PARAMETERS.reduce((s, p) => s + (Number(scores[p.key]) || 0), 0);
  const invalid = (key: string, max: number) => {
    const v = scores[key];
    return v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > max);
  };
  const anyInvalid = PARAMETERS.some((p) => invalid(p.key, p.max));

  // each submit produces a new state object: acknowledge a save once, or show the error
  React.useEffect(() => {
    if (state.ok) {
      // a saved review is acknowledged with the thank-you window instead of the fading popup
      setThanksOpen(true);
      setDirty(false);
    } else if (state.error) {
      toast(state.error, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // warn before leaving with unsaved scores
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmed.current) {
      confirmed.current = false;
      return;
    }
    e.preventDefault();
    if (filled === PARAMETERS.length && !anyInvalid) setSummaryOpen(true);
  }

  function confirmSubmit() {
    confirmed.current = true;
    setSummaryOpen(false);
    formRef.current?.requestSubmit();
  }

  async function clearReview() {
    setClearing(true);
    const res = await clearReviewAction(orgId);
    setClearing(false);
    setConfirmClear(false);
    if (res.ok) {
      setScores(Object.fromEntries(PARAMETERS.map((p) => [p.key, ''])));
      setRemarks(Object.fromEntries(PARAMETERS.map((p) => [p.key, ''])));
      setDirty(false);
      toast('review cleared');
      router.refresh();
    } else toast(res.error ?? 'could not clear review', 'error');
  }

  return (
    <>
      <form ref={formRef} action={action} onSubmit={onSubmit} onChange={() => setDirty(true)}>
        <input type="hidden" name="orgId" value={orgId} />
        {PARAMETERS.map((p, i) => {
          const pct = Math.min(100, ((Number(scores[p.key]) || 0) / p.max) * 100);
          return (
            <div className="param" key={p.key}>
              <div className="param-head">
                <span className="param-title">{i + 1}. {p.label}</span>
                <span className="hint">max {p.max}</span>
              </div>
              <p className="hint">{p.hint}</p>
              <div className="param-meter" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
              <div className="score-row">
                <div>
                  <label htmlFor={`score_${p.key}`}>score</label>
                  <input
                    id={`score_${p.key}`}
                    name={`score_${p.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={p.max}
                    step="0.5"
                    required
                    className={invalid(p.key, p.max) ? 'field-error' : undefined}
                    aria-invalid={invalid(p.key, p.max)}
                    value={scores[p.key]}
                    onChange={(e) => setScores({ ...scores, [p.key]: e.target.value })}
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor={`remarks_${p.key}`}>remarks</label>
                  <textarea id={`remarks_${p.key}`} name={`remarks_${p.key}`} value={remarks[p.key]} onChange={(e) => setRemarks({ ...remarks, [p.key]: e.target.value })} style={{ minHeight: 38 }} />
                </div>
              </div>
              {invalid(p.key, p.max) && <p className="err">enter a number from 0 to {p.max}</p>}
            </div>
          );
        })}

        <div className="total-bar">
          <div className="row" style={{ alignItems: 'center' }}>
            <div>
              <div className="small muted">final score</div>
              <div className="big">{total} <small>/ {JURY_MAX}</small></div>
            </div>
            <div className="small muted">{filled} of {PARAMETERS.length} scored</div>
          </div>
          {state.error && <p className="err" role="alert">{state.error}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-3)', margin: 'var(--space-3) 0', flexWrap: 'wrap' }}>
            <Submit label={existing.length ? 'update review' : 'submit review'} disabled={filled < PARAMETERS.length || anyInvalid} />
            {existing.length > 0 && (
              <button type="button" className="btn danger" onClick={() => setConfirmClear(true)}>clear my review</button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={summaryOpen}
        wide
        title={existing.length ? 'are you sure you want to update your scores?' : 'are you sure you want to submit your scores?'}
        body={
          <>
            <table className="summary">
              <tbody>
                {PARAMETERS.map((p, i) => (
                  <tr key={p.key}>
                    <td>{i + 1}. {p.label}</td>
                    <td className="num"><strong>{Number(scores[p.key]) || 0}</strong> <span className="muted">/ {p.max}</span></td>
                  </tr>
                ))}
                <tr className="total">
                  <td>total</td>
                  <td className="num"><strong>{total}</strong> <span className="muted">/ {JURY_MAX}</span></td>
                </tr>
              </tbody>
            </table>
            <p className="hint" style={{ marginTop: 'var(--space-3)' }}>choose no to go back and revisit your scores.</p>
          </>
        }
        confirmLabel="yes"
        cancelLabel="no"
        onConfirm={confirmSubmit}
        onCancel={() => setSummaryOpen(false)}
      />

      <InfoDialog
        open={thanksOpen}
        title="thank you for submitting your scores"
        onClose={() => setThanksOpen(false)}
        actions={
          <>
            <button type="button" className="btn secondary" onClick={() => setThanksOpen(false)}>stay on this page</button>
            <Link href="/jury" className="btn">back to the home screen</Link>
          </>
        }
      >
        your scores for this organisation have been saved.
      </InfoDialog>

      <ConfirmDialog
        open={confirmClear}
        title="clear your review?"
        body="this removes your scores and remarks for this organisation. you can score it again afterwards."
        confirmLabel="clear review"
        danger
        busy={clearing}
        onConfirm={clearReview}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
