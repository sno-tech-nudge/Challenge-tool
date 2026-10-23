'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { submitReviewAction, clearReviewAction, type FormState } from '@/lib/actions';
import { PARAMETERS, SCORE_MIN, SCORE_MAX, SCORE_STEP, weightedPoints, computeTotal, type ScoreEntry } from '@/lib/rubric';
import { JURY_RAW_MAX } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InfoDialog } from '@/components/InfoDialog';

const FORM_ID = 'review-form';

export function ReviewForm({ orgId, existing, existingVerdict, existingRemarks }: { orgId: string; existing: ScoreEntry[]; existingVerdict: string | null; existingRemarks: string }) {
  const toast = useToast();
  const router = useRouter();
  const [state, action] = useFormState<FormState, FormData>(submitReviewAction, {});
  const byKey = new Map(existing.map((e) => [e.key, e]));
  const initialScores = Object.fromEntries(PARAMETERS.map((p) => [p.key, byKey.has(p.key) ? String(byKey.get(p.key)!.score) : '']));
  const [scores, setScores] = React.useState<Record<string, string>>(initialScores);
  const initialRemarks = Object.fromEntries(PARAMETERS.map((p) => [p.key, byKey.get(p.key)?.remarks ?? '']));
  const [remarks, setRemarks] = React.useState<Record<string, string>>(initialRemarks);
  const [verdict, setVerdict] = React.useState<string>(existingVerdict ?? '');
  const [internal, setInternal] = React.useState(existingRemarks);
  const [dirty, setDirty] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  // the verdict segment sits under both panes of the page, so it is drawn into a slot there
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => setSlot(document.getElementById('jury-bottom')), []);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  // every submit goes through a summary dialog first; confirming re-submits the form once
  const formRef = React.useRef<HTMLFormElement>(null);
  const confirmed = React.useRef(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [thanksOpen, setThanksOpen] = React.useState(false);

  const filled = PARAMETERS.filter((p) => scores[p.key] !== '').length;
  // same formula the server uses; the saved total is the weighted total out of 100
  const total = computeTotal(Object.fromEntries(PARAMETERS.map((p) => [p.key, Number(scores[p.key]) || 0])));
  const invalid = (key: string) => {
    const v = scores[key];
    if (v === '') return false;
    const n = Number(v);
    return !Number.isFinite(n) || n < SCORE_MIN || n > SCORE_MAX || Math.round(n / SCORE_STEP) * SCORE_STEP !== n;
  };
  const anyInvalid = PARAMETERS.some((p) => invalid(p.key));
  const canSubmit = filled === PARAMETERS.length && !anyInvalid && verdict !== '';

  // each submit produces a new state object: acknowledge a save once, or show the error
  React.useEffect(() => {
    setSubmitting(false);
    if (state.ok) {
      // a saved review is acknowledged with the thank-you slide, then the person is taken back to the list
      setThanksOpen(true);
      setDirty(false);
    } else if (state.error) {
      toast(state.error, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => {
    if (!thanksOpen) return;
    const t = window.setTimeout(() => router.push('/jury'), 2600);
    return () => window.clearTimeout(t);
  }, [thanksOpen, router]);

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
    if (canSubmit) setSummaryOpen(true);
  }

  function confirmSubmit() {
    confirmed.current = true;
    setSubmitting(true);
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
      setVerdict('');
      setInternal('');
      setDirty(false);
      toast('review cleared');
      router.refresh();
    } else toast(res.error ?? 'could not clear review', 'error');
  }

  return (
    <>
      <form id={FORM_ID} ref={formRef} action={action} onSubmit={onSubmit} onChange={() => setDirty(true)}>
        <input type="hidden" name="orgId" value={orgId} />
        {PARAMETERS.map((p, i) => {
          const n = Number(scores[p.key]) || 0;
          const pct = Math.min(100, (n / SCORE_MAX) * 100);
          return (
            <div className="param" key={p.key}>
              <div className="param-head">
                <span className="param-title">{i + 1}. {p.label}</span>
                <span className="pill">{p.weight}%</span>
              </div>
              <details className="param-help">
                <summary>questions to consider</summary>
                <h4>component questions</h4>
                <ul>{p.components.map((t) => <li key={t}>{t}</li>)}</ul>
                <h4>jury lens: scale and punt-ability</h4>
                <ul>{p.lens.map((t) => <li key={t}>{t}</li>)}</ul>
              </details>
              <div className="param-meter" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
              <div className="score-row">
                <div>
                  <label htmlFor={`score_${p.key}`}>score out of {SCORE_MAX}</label>
                  <input
                    id={`score_${p.key}`}
                    name={`score_${p.key}`}
                    type="number"
                    inputMode="decimal"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                    step={SCORE_STEP}
                    required
                    className={invalid(p.key) ? 'field-error' : undefined}
                    aria-invalid={invalid(p.key)}
                    value={scores[p.key]}
                    onChange={(e) => setScores({ ...scores, [p.key]: e.target.value })}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <div className="hint" style={{ marginTop: 4 }}>
                    = {scores[p.key] !== '' && !invalid(p.key) ? weightedPoints(p, n) : '-'} of {p.weight} points
                  </div>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor={`remarks_${p.key}`}>remarks</label>
                  <textarea id={`remarks_${p.key}`} name={`remarks_${p.key}`} value={remarks[p.key]} onChange={(e) => setRemarks({ ...remarks, [p.key]: e.target.value })} style={{ minHeight: 38 }} />
                </div>
              </div>
              {invalid(p.key) && <p className="err">enter a score from {SCORE_MIN} to {SCORE_MAX} (whole or half points)</p>}
            </div>
          );
        })}

        <div className="total-bar">
          <div className="row" style={{ alignItems: 'center' }}>
            <div>
              <div className="small muted">your total</div>
              <div className="big">{total} <small>/ {JURY_RAW_MAX}</small></div>
            </div>
            <div className="small muted">{filled} of {PARAMETERS.length} scored</div>
          </div>
          <p className="hint" style={{ marginTop: 'var(--space-2)' }}>when all six are scored, give your final verdict at the bottom of the page and submit.</p>
        </div>
      </form>

      {slot && createPortal(
        <section className="card accent verdict-wide" id="your-verdict">
          <h2>final verdict</h2>
          <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>would you back this organisation? this is your own call, separate from the scores above.</p>
          <div className="verdict-grid">
            <div>
              <div className="small muted" style={{ marginBottom: 6, fontWeight: 600 }}>your verdict</div>
              <div className="verdict-choice" role="radiogroup" aria-label="your final verdict">
                {([['Y', 'yes'], ['N', 'no']] as const).map(([v, label]) => (
                  <label key={v} className={verdict === v ? `on ${v === 'Y' ? 'yes' : 'no'}` : ''}>
                    <input type="radio" name="verdict" value={v} form={FORM_ID} checked={verdict === v} onChange={() => setVerdict(v)} /> {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="internalRemarks">internal remarks</label>
              <textarea id="internalRemarks" name="internalRemarks" form={FORM_ID} value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="anything the team should know, or questions to follow up" />
              <p className="hint" style={{ marginTop: 4 }}>shown to the admin team with your review, and in internal remarks on this page.</p>
            </div>
          </div>
          {state.error && <p className="err" role="alert">{state.error}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" form={FORM_ID} className="btn" disabled={submitting || !canSubmit}>{submitting ? 'saving…' : existing.length ? 'update review' : 'submit review'}</button>
            {existing.length > 0 && (
              <button type="button" className="btn danger" onClick={() => setConfirmClear(true)}>clear my review</button>
            )}
            {!canSubmit && <span className="hint">{filled < PARAMETERS.length ? 'score all six criteria' : verdict === '' ? 'choose yes or no' : 'fix the highlighted score'} to submit.</span>}
          </div>
        </section>,
        slot,
      )}

      <ConfirmDialog
        open={summaryOpen}
        wide
        title={existing.length ? 'are you sure you want to update your scores?' : 'are you sure you want to submit your scores?'}
        body={
          <>
            <table className="summary">
              <thead>
                <tr><th>criterion</th><th className="num">score</th><th className="num">points</th></tr>
              </thead>
              <tbody>
                {PARAMETERS.map((p, i) => (
                  <tr key={p.key}>
                    <td>{i + 1}. {p.label}</td>
                    <td className="num"><strong>{Number(scores[p.key]) || 0}</strong> <span className="muted">/ {SCORE_MAX}</span></td>
                    <td className="num"><strong>{weightedPoints(p, Number(scores[p.key]) || 0)}</strong> <span className="muted">/ {p.weight}</span></td>
                  </tr>
                ))}
                <tr className="total">
                  <td colSpan={2}>total</td>
                  <td className="num"><strong>{total}</strong> <span className="muted">/ {JURY_RAW_MAX}</span></td>
                </tr>
                <tr>
                  <td colSpan={2}>your final verdict</td>
                  <td className="num"><strong>{verdict === 'Y' ? 'yes' : verdict === 'N' ? 'no' : '-'}</strong></td>
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
        title="thank you for your submission"
        onClose={() => router.push('/jury')}
        actions={<Link href="/jury" className="btn">back to organisations</Link>}
      >
        your review has been saved. taking you back to the list of organisations.
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
