import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { listActivity, ACTIVITY_ACTIONS, type ActivityAction } from '@/lib/activity';
import { SettingsFrame } from '@/components/SettingsFrame';
import { Pill } from '@/components/ui';
import { ActivityFilters } from './ActivityFilters';

export const dynamic = 'force-dynamic';

const TONE: Partial<Record<ActivityAction, 'good' | 'bad' | 'warn' | 'solid'>> = {
  REVIEW_SUBMITTED: 'good',
  REVIEW_UPDATED: 'good',
  REVIEW_CLEARED: 'warn',
  VERDICT_CHANGED: 'solid',
  ECOCIATE_CHANGED: 'solid',
  MEMBER_REMOVED: 'bad',
  PASSWORD_RESET: 'warn',
};

/** Shown in Indian time whatever the server's clock zone is, so everyone reads the same moment. */
function when(d: Date) {
  const opts = { timeZone: 'Asia/Kolkata' } as const;
  const day = d.toLocaleDateString('en-IN', { ...opts, day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { ...opts, hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${time}`;
}

export default async function ActivityPage({ searchParams }: { searchParams: { action?: string; actor?: string; page?: string } }) {
  const user = await requireRole('ADMIN');
  const { rows, total, page, pages, actors } = await listActivity({
    action: searchParams.action,
    actor: searchParams.actor,
    page: Number(searchParams.page) || 1,
  });

  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (searchParams.action) q.set('action', searchParams.action);
    if (searchParams.actor) q.set('actor', searchParams.actor);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return `/admin/settings/activity${s ? `?${s}` : ''}`;
  };

  return (
    <SettingsFrame user={user} subtitle="who scored, changed a verdict or edited the ecociate score, and when. times are in India time.">
      <ActivityFilters
        actions={Object.entries(ACTIVITY_ACTIONS).map(([value, label]) => ({ value, label }))}
        actors={actors.map((a) => ({ value: a.actorId, label: a.actorName }))}
        action={searchParams.action ?? ''}
        actor={searchParams.actor ?? ''}
      />

      <div className="card scroll" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>when</th>
              <th>who</th>
              <th>what</th>
              <th>organisation</th>
              <th>details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{when(r.at)}</td>
                <td><strong>{r.actorName}</strong></td>
                <td><Pill tone={TONE[r.action as ActivityAction]}>{ACTIVITY_ACTIONS[r.action as ActivityAction] ?? r.action}</Pill></td>
                <td>{r.orgId && r.orgName ? <Link href={`/admin/${r.orgId}`} className="org-link">{r.orgName}</Link> : <span className="muted">-</span>}</td>
                <td className="pre" style={{ whiteSpace: 'normal', minWidth: 220 }}>{r.detail ?? <span className="muted">-</span>}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 32 }}>no activity yet. it will appear here as people score and edit.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pager">
          <span className="small muted">page {page} of {pages} ({total} entries)</span>
          <div className="pager-nav">
            <Link href={qs(page - 1)} className="btn secondary sm" aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : 0}>newer</Link>
            <Link href={qs(page + 1)} className="btn secondary sm" aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : 0}>older</Link>
          </div>
        </div>
      )}
    </SettingsFrame>
  );
}
