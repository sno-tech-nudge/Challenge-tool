'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Eye, EyeOff, KeyRound, Pencil, Trash2, UserPlus, Wand2 } from 'lucide-react';
import type { FormState } from '@/lib/actions';
import { addMemberAction, updateMemberAction, deleteMemberAction } from '@/lib/team-actions';
import { SidePanel } from '@/components/SidePanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Pill } from '@/components/ui';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  reviews: number;
}

const icon = { size: 14, strokeLinejoin: 'miter' as const, strokeLinecap: 'square' as const };

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn" disabled={pending}>{pending ? 'saving…' : label}</button>;
}

/** Password box with show / hide and a generator, so the admin can hand over a ready-made password. */
function PasswordField({ required, label, placeholder }: { required?: boolean; label: string; placeholder?: string }) {
  const id = React.useId();
  const [shown, setShown] = React.useState(false);
  const [value, setValue] = React.useState('');
  function generate() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    setValue(Array.from(bytes, (b) => chars[b % chars.length]).join(''));
    setShown(true);
  }
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="pw-row">
        <input id={id} name="password" type={shown ? 'text' : 'password'} autoComplete="new-password" required={required} minLength={8} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="button" className="btn secondary sm" onClick={() => setShown(!shown)} aria-label={shown ? 'hide password' : 'show password'}>
          {shown ? <EyeOff {...icon} /> : <Eye {...icon} />}
        </button>
        <button type="button" className="btn secondary sm" onClick={generate} title="generate a random password">
          <Wand2 {...icon} /> generate
        </button>
      </div>
      <p className="hint" style={{ marginTop: 4 }}>at least 8 characters. share it with the person yourself; it cannot be viewed again.</p>
    </div>
  );
}

function AddMemberForm({ close }: { close: () => void }) {
  const toast = useToast();
  const [state, action] = useFormState<FormState, FormData>(addMemberAction, {});
  React.useEffect(() => {
    if (state.ok) {
      toast('member added');
      close();
    } else if (state.error) toast(state.error, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="stack">
      <div>
        <label htmlFor="add-name">name</label>
        <input id="add-name" name="name" required maxLength={80} autoComplete="off" style={{ width: '100%' }} />
      </div>
      <div>
        <label htmlFor="add-email">id (email used to sign in)</label>
        <input id="add-email" name="email" type="email" required autoComplete="off" style={{ width: '100%' }} />
      </div>
      <PasswordField required label="password" />
      <div>
        <label htmlFor="add-role">role</label>
        <select id="add-role" name="role" defaultValue="JURY">
          <option value="JURY">jury (scores organisations)</option>
          <option value="ADMIN">admin (sees everything, manages settings)</option>
        </select>
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <Save label="add member" />
    </form>
  );
}

function EditMemberForm({ member, close }: { member: Member; close: () => void }) {
  const toast = useToast();
  const [state, action] = useFormState<FormState, FormData>(updateMemberAction, {});
  React.useEffect(() => {
    if (state.ok) {
      toast('member updated');
      close();
    } else if (state.error) toast(state.error, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="userId" value={member.id} />
      <div>
        <label htmlFor={`name-${member.id}`}>name</label>
        <input id={`name-${member.id}`} name="name" required maxLength={80} defaultValue={member.name} autoComplete="off" style={{ width: '100%' }} />
      </div>
      <div>
        <label htmlFor={`email-${member.id}`}>id (email used to sign in)</label>
        <input id={`email-${member.id}`} name="email" type="email" required defaultValue={member.email} autoComplete="off" style={{ width: '100%' }} />
        <p className="hint" style={{ marginTop: 4 }}>changing the id changes what they type to sign in.</p>
      </div>
      <PasswordField label="new password (optional)" placeholder="leave blank to keep the current one" />
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <Save label="save changes" />
    </form>
  );
}

export function TeamManager({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const toast = useToast();
  const [removing, setRemoving] = React.useState<Member | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    if (!removing) return;
    setBusy(true);
    const res = await deleteMemberAction(removing.id);
    setBusy(false);
    if (res.ok) toast('member removed');
    else toast(res.error ?? 'could not remove member', 'error');
    setRemoving(null);
  }

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <p className="small muted">{members.length} member{members.length === 1 ? '' : 's'}</p>
        <SidePanel label="add member" title="add member" icon={<UserPlus {...icon} />} triggerClass="btn">
          {(close) => <AddMemberForm close={close} />}
        </SidePanel>
      </div>

      <div className="card scroll" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th>id (sign-in email)</th>
              <th>role</th>
              <th className="num">reviews</th>
              <th style={{ width: 1 }}><span className="sr-only">actions</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong>{m.id === currentUserId && <span className="muted small"> (you)</span>}</td>
                <td>{m.email}</td>
                <td><Pill tone={m.role === 'ADMIN' ? 'solid' : undefined}>{m.role === 'ADMIN' ? 'admin' : 'jury'}</Pill></td>
                <td className="num">{m.reviews}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <SidePanel label="edit / reset password" title={`edit ${m.name}`} icon={<><Pencil {...icon} /><KeyRound {...icon} /></>}>
                      {(close) => <EditMemberForm member={m} close={close} />}
                    </SidePanel>
                    <button type="button" className="btn danger sm" onClick={() => setRemoving(m)} disabled={m.id === currentUserId} title={m.id === currentUserId ? 'you cannot remove yourself' : 'remove member'}>
                      <Trash2 {...icon} /> <span className="btn-label">remove</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={removing !== null}
        title={`remove ${removing?.name ?? ''}?`}
        body={`${removing?.email ?? ''} will no longer be able to sign in. Members who have already submitted reviews cannot be removed.`}
        confirmLabel="remove member"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
