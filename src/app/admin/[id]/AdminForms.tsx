'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { saveEcociateAction, setVerdictAction, type FormState } from '@/lib/actions';
import { ECOCIATE_MAX } from '@/lib/constants';
import { useToast } from '@/components/Toast';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn" disabled={pending}>{pending ? 'saving…' : label}</button>;
}

/** One outcome toast per submit; the inline error stays visible next to the field too. */
function useOutcome(state: FormState, okText: string) {
  const toast = useToast();
  React.useEffect(() => {
    if (state.ok) toast(okText);
    else if (state.error) toast(state.error, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function VerdictForm({ orgId, verdict, comment }: { orgId: string; verdict: string | null; comment: string }) {
  const [state, action] = useFormState<FormState, FormData>(setVerdictAction, {});
  useOutcome(state, 'verdict updated');
  const options: [string, string][] = [['Y', 'yes'], ['N', 'no'], ['', 'undecided']];
  return (
    <form action={action} className="stack">
      <input type="hidden" name="orgId" value={orgId} />
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="small muted" style={{ marginBottom: 6, fontWeight: 600 }}>verdict</legend>
        <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          {options.map(([v, label]) => (
            <label key={label} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 'var(--fs-body)', color: 'var(--text-primary)', margin: 0 }}>
              <input type="radio" name="verdict" value={v} defaultChecked={(verdict ?? '') === v} /> {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="comment">comment and rationale</label>
        <textarea id="comment" name="comment" defaultValue={comment} />
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <Submit label="save verdict" />
    </form>
  );
}

export function EcociateForm({ orgId, score, remarks }: { orgId: string; score: number | null; remarks: string }) {
  const [state, action] = useFormState<FormState, FormData>(saveEcociateAction, {});
  useOutcome(state, 'ecociate score updated');
  return (
    <form action={action} className="stack">
      <input type="hidden" name="orgId" value={orgId} />
      <div>
        <label htmlFor="score">score out of {ECOCIATE_MAX} (blank = not fed yet)</label>
        <input id="score" name="score" type="number" min={0} max={ECOCIATE_MAX} step="0.1" defaultValue={score ?? ''} />
      </div>
      <div>
        <label htmlFor="remarks">remarks and reasoning</label>
        <textarea id="remarks" name="remarks" defaultValue={remarks} />
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <Submit label="save" />
    </form>
  );
}
