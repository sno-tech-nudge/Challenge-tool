import { requireRole } from '@/lib/auth/session';
import Link from 'next/link';
import { listSnapshot, jurorProgress, recentRescores } from '@/lib/queries';
import { formatMoment } from '@/lib/slots';
import { toJuryScale } from '@/lib/scoring';
import { ECOCIATE_MAX, JURY_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner } from '@/components/ui';
import { SnapshotTable } from './SnapshotTable';

export const dynamic = 'force-dynamic';

export default async function AdminSnapshot() {
  const user = await requireRole('ADMIN');
  const [rows, progress, rescores] = await Promise.all([listSnapshot(), jurorProgress(), recentRescores()]);

  const scored = rows.filter((r) => r.final !== null);
  const decided = rows.filter((r) => r.verdict).length;
  const yes = rows.filter((r) => r.verdict === 'Y').length;

  return (
    <Shell user={user}>
      <PageBanner
        eyebrow="the aahaar bazaar challenge · admin"
        title="snapshot"
      />
      <div className="wrap stack">
        <section className="card overview" aria-label="overview">
          <div className="stat">
            <span className="label">organisations</span>
            <span className="value">{rows.length}</span>
            <span className="note">{scored.length} fully scored</span>
          </div>
          <div className="stat">
            <span className="label">verdicts given</span>
            <span className="value">{decided} / {rows.length}</span>
            <span className="note">{yes} yes, {decided - yes} no</span>
          </div>
          <div className="jurors">
            <span className="label">juror progress</span>
            <div className="jurors-grid">
              {progress.map((j) => (
                <div className="juror" key={j.id}>
                  <strong>{j.name}</strong>
                  <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={j.scored} aria-label={`${j.name} progress`}>
                    <span style={{ width: `${rows.length ? (j.scored / rows.length) * 100 : 0}%` }} />
                  </div>
                  <span className="count">{j.scored}/{rows.length}</span>
                </div>
              ))}
              {progress.length === 0 && <p className="muted small">no jurors yet.</p>}
            </div>
          </div>
        </section>

        {rescores.length > 0 && (
          <section className="card rescore-card" aria-label="rescored recently">
            <h2>rescored recently</h2>
            <p className="hint">jurors who changed a submitted review in the last 7 days.</p>
            <ul>
              {rescores.map((r) => (
                <li key={`${r.orgId}-${r.juror.name}`}>
                  <Link href={`/admin/${r.orgId}`}>{r.org.name}</Link>
                  <span>
                    {r.juror.name}{r.previousTotal !== null && `: ${toJuryScale(r.previousTotal)} to ${toJuryScale(r.total)} / ${JURY_MAX}`}
                    <span className="muted"> · {formatMoment(r.rescoredAt!)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <SnapshotTable rows={rows} />
      </div>
    </Shell>
  );
}
