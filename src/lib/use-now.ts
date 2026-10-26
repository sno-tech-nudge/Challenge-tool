'use client';

import React from 'react';

/** The current time, refreshed every few seconds so a slot opening (or ending) is noticed on a page
 *  that stays open. It starts from the server's time so the first render matches the server's. */
export function useNow(serverNow: string, every = 15000): Date {
  const [now, setNow] = React.useState(() => new Date(serverNow));
  React.useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), every);
    return () => window.clearInterval(t);
  }, [every]);
  return now;
}
