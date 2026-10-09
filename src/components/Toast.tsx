'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

type Kind = 'ok' | 'error';
interface Item {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = React.createContext<(text: string, kind?: Kind) => void>(() => {});
export const useToast = () => React.useContext(ToastContext);

const POPUP_MS = 1900;

/** Success messages show as a centred confirmation popup that fades away by itself; errors stay as a
 *  small dismissible toast in the corner for longer so they are not missed. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const next = React.useRef(1);

  const dismiss = React.useCallback((id: number) => setItems((l) => l.filter((i) => i.id !== id)), []);
  const push = React.useCallback(
    (text: string, kind: Kind = 'ok') => {
      const id = next.current++;
      // only one confirmation popup at a time: a new one replaces the previous
      setItems((l) => [...l.filter((i) => (kind === 'ok' ? i.kind !== 'ok' : true)).slice(-3), { id, text, kind }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : POPUP_MS);
    },
    [dismiss],
  );

  const popup = items.find((i) => i.kind === 'ok');
  const errors = items.filter((i) => i.kind === 'error');

  return (
    <ToastContext.Provider value={push}>
      {children}
      {popup && (
        <div key={popup.id} className="popup" role="status" aria-live="polite">
          <span className="tick" aria-hidden="true">
            <Check size={18} strokeWidth={3} strokeLinejoin="miter" strokeLinecap="square" />
          </span>
          <span>{popup.text}</span>
        </div>
      )}
      <div className="toasts" role="alert" aria-live="assertive">
        {errors.map((i) => (
          <div key={i.id} className="toast error">
            <span>{i.text}</span>
            <button type="button" onClick={() => dismiss(i.id)} aria-label="dismiss">
              <X size={14} strokeLinejoin="miter" strokeLinecap="square" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
