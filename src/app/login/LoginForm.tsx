'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type LoginState } from '@/lib/auth/actions';

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn" disabled={pending} style={{ width: '100%' }}>{pending ? 'signing in…' : 'sign in'}</button>;
}

export function LoginForm() {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="stack">
      <div>
        <label htmlFor="email">email</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus style={{ width: '100%' }} />
      </div>
      <div>
        <label htmlFor="password">password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required style={{ width: '100%' }} />
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <Submit />
    </form>
  );
}
