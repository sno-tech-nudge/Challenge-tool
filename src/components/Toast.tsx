'use client';

import React from 'react';
import { X } from 'lucide-react';

type Kind = 'ok' | 'error';
interface Item {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = React.createContext<(text: string, kind?: Kind) => void>(() => {});
export const useToast = () => React.useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const next = React.useRef(1);

  const dismiss = React.useCallback((id: number) => setItems((l) => l.filter((i) => i.id !== id)), []);
  const push = React.useCallback(
    (text: string, kind: Kind = 'ok') => {
      const id = next.current++;
      setItems((l) => [...l.slice(-3), { id, text, kind }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast${i.kind === 'error' ? ' error' : ''}`}>
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
