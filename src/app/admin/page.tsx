import { requireRole } from '@/lib/auth/session';
import { listSnapshot, jurorProgress } from '@/lib/queries';
import { ECOCIATE_MAX, JURY_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner, Kpi } from '@/components/ui';
import { SnapshotTable } from './SnapshotTable';

export const dynamic = 'force-dynamic';

export default async function AdminSnapshot() {
  const user = await requireRole('ADMIN');
  const [rows, progress] = await Promise.all([listSnapshot(), jurorProgress()]);

  const scored = rows.filter((r) => r.final !== null);
  const decided = rows.filter((r) => r.verdict).length;
  const yes = rows.filter((r) => r.verdict === 'Y').length;

  return (
    <Shell user={user}>
      <PageBanner
        eyebrow="aahaar bazaar challenge · admin"
        title="snapshot"
      />
      <div className="wrap stack">
        <div className="grid3">
          <Kpi label="organisations" value={rows.length} note={`${scored.length} fully scored`} />
          <Kpi label="verdicts given" value={`${decided} / ${rows.length}`} note={`${yes} yes, ${decided - yes} no`} />
        </div>

        <div className="card accent">
          <div className="row" style={{ marginBottom: 'var(--space-3)' }}><h2 style={{ margin: 0 }}>juror progress</h2></div>
          <div className="grid3">
            {progress.map((j) => (
              <div key={j.id}>
                <div className="row small"><strong>{j.name}</strong><span className="muted">{j.scored} of {rows.length}</span></div>
                <div className="bar" style={{ marginTop: 6 }} role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={j.scored} aria-label={`${j.name} progress`}>
                  <span style={{ width: `${rows.length ? (j.scored / rows.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {progress.length === 0 && <p className="muted small">no jurors yet.</p>}
          </div>
        </div>

        <SnapshotTable rows={rows} />
      </div>
    </Shell>
  );
}
