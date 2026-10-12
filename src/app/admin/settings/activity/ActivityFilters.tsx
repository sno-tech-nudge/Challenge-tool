'use client';

import { useRouter } from 'next/navigation';

interface Option {
  value: string;
  label: string;
}

/** Filters live in the URL, so a filtered view can be bookmarked or shared. */
export function ActivityFilters({ actions, actors, action, actor }: { actions: Option[]; actors: Option[]; action: string; actor: string }) {
  const router = useRouter();

  function go(next: { action?: string; actor?: string }) {
    const q = new URLSearchParams();
    const a = next.action ?? action;
    const p = next.actor ?? actor;
    if (a) q.set('action', a);
    if (p) q.set('actor', p);
    const s = q.toString();
    router.replace(`/admin/settings/activity${s ? `?${s}` : ''}`);
  }

  return (
    <div className="toolbar" style={{ marginBottom: 0 }}>
      <div className="end" style={{ marginLeft: 0 }}>
        <label htmlFor="f-action">what</label>
        <select id="f-action" value={action} onChange={(e) => go({ action: e.target.value })}>
          <option value="">all activity</option>
          {actions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="end" style={{ marginLeft: 0 }}>
        <label htmlFor="f-actor">who</label>
        <select id="f-actor" value={actor} onChange={(e) => go({ actor: e.target.value })}>
          <option value="">everyone</option>
          {actors.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {(action || actor) && (
        <button type="button" className="btn ghost sm" onClick={() => router.replace('/admin/settings/activity')}>clear filters</button>
      )}
    </div>
  );
}
