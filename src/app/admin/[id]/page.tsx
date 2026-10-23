import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getOrgForAdmin, listJurors, orgNeighbours } from '@/lib/queries';
import { PARAMETERS, parseEntries } from '@/lib/rubric';
import { snapshot } from '@/lib/scoring';
import { parseDetails } from '@/lib/orgSections';
import { ECOCIATE_MAX, JURY_MAX, JURY_RAW_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill, ScoreBar, scoreTone } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { OrgDetails } from '@/components/OrgDetails';
import { VerdictForm, EcociateForm } from './AdminForms';

export const dynamic = 'force-dynamic';

const show = (n: number | null) => (n === null ? '-' : String(n));

export default async function AdminOrgPage({ params }: { params: { id: string } }) {
  const user = await requireRole('ADMIN');
  const [org, jurors, nav] = await Promise.all([getOrgForAdmin(params.id), listJurors(), orgNeighbours(params.id)]);
  if (!org) notFound();

  const snap = snapshot(org.ecociateScore, org.scores.map((s) => s.total));
  // one column per juror account, so a juror who has not scored yet still shows as an empty column
  const byJuror = new Map(org.scores.map((s) => [s.jurorId, { total: s.total, verdict: s.verdict, entries: new Map(parseEntries(s.entries).map((e) => [e.key, e])) }]));
  const finalTone = snap.final === null ? null : scoreTone(snap.final, 100);

  return (
    <Shell user={user}>
      <div className="workspace has-footer">
      <PageBanner compact
        eyebrow={org.slot ? `the aahaar bazaar challenge · score card · slot ${org.slot}` : 'the aahaar bazaar challenge · score card'}
        title={org.name}
        actions={org.verdict ? <Pill tone={org.verdict === 'Y' ? 'good' : 'bad'}>verdict: {org.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <Pill tone="warn">verdict pending</Pill>}
      />
      <div className="wrap">
        <OrgPager base="/admin" baseLabel="snapshot" name={org.name} {...nav} />

        <div className="split even">
          <div className="pane stack">
            <section className="card accent" id="details">
              <h2>organisation details</h2>
              <OrgDetails website={org.website} idPrefix="a" details={parseDetails(org.details)} />
            </section>
            <section className="card" id="internal">
              <h2>internal remarks</h2>
              {org.internalQueries && (
                <>
                  <h3>queries</h3>
                  <p className="pre">{org.internalQueries}</p>
                </>
              )}
              <h3>jury remarks</h3>
              {org.scores.some((x) => x.internalRemarks) ? (
                org.scores.filter((x) => x.internalRemarks).map((x) => (
                  <div key={x.id} className="remark">
                    <div className="small muted">{x.juror.name}</div>
                    <p className="pre">{x.internalRemarks}</p>
                  </div>
                ))
              ) : (
                <p className="muted">none yet</p>
              )}
            </section>
          </div>

          <div className="pane">
            <div className="stack">
              <section className="card accent" id="scores">
                <h2>scores</h2>
                <div className="row" style={{ alignItems: 'center' }}>
                  <span>ecociate</span>
                  <span className="big">{show(snap.ecociate)} <small>/ {ECOCIATE_MAX}</small></span>
                </div>
                <h3>jury scores</h3>
                {jurors.length === 0 && <p className="muted small">no jurors yet.</p>}
                {jurors.map((j) => {
                  const total = byJuror.get(j.id)?.total ?? null;
                  return (
                    <div className="row" key={j.id} style={{ alignItems: 'center', padding: '4px 0' }}>
                      <span>{j.name}</span>
                      <span><strong>{show(total)}</strong> <span className="muted small">/ {JURY_RAW_MAX}</span></span>
                    </div>
                  );
                })}
                <div className="row" style={{ alignItems: 'center', marginTop: 'var(--space-2)' }}>
                  <span>jury average <span className="muted small">({snap.juryCount} jurors)</span></span>
                  <span><strong>{show(snap.juryAvgRaw)}</strong> <span className="muted small">/ {JURY_RAW_MAX}</span></span>
                </div>
                <div className="row" style={{ alignItems: 'center', marginTop: 'var(--space-1)' }}>
                  <span>jury score <span className="muted small">(average scaled to {JURY_MAX})</span></span>
                  <span><strong>{show(snap.juryAvg)}</strong> <span className="muted small">/ {JURY_MAX}</span></span>
                </div>
                <div className="row" style={{ alignItems: 'center', borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)' }}>
                  <strong>final score</strong>
                  <span className={`big${finalTone ? ` tone-${finalTone}` : ''}`}>{show(snap.final)} <small>/ 100</small></span>
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}><ScoreBar value={snap.final} max={100} /></div>
                {snap.final === null && <p className="hint" style={{ marginTop: 'var(--space-2)' }}>the final score appears once the ecociate score is fed and at least one juror has scored.</p>}
              </section>
              <section className="card" id="ecociate">
                <h2>ecociate score and reasoning</h2>
                <EcociateForm orgId={org.id} score={org.ecociateScore} remarks={org.ecociateRemarks ?? ''} />
              </section>
            <section className="card scroll" id="jury" style={{ padding: 0 }}>
              <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}><h2 style={{ margin: 0 }}>jury scores by juror</h2><p className="hint" style={{ marginTop: 4 }}>each score is out of 10; the total is weighted out of {JURY_RAW_MAX}.</p></div>
              <table className="compact">
                <thead>
                  <tr>
                    <th>criterion</th><th className="num">weight</th>
                    {jurors.map((j) => <th key={j.id} className="num">{j.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PARAMETERS.map((p) => (
                    <tr key={p.key}>
                      <td>{p.label}</td>
                      <td className="num muted">{p.weight}%</td>
                      {jurors.map((j) => {
                        const e = byJuror.get(j.id)?.entries.get(p.key);
                        return (
                          <td key={j.id} className="num">
                            {e ? e.score : <span className="muted">-</span>}
                            {e?.remarks && <div className="muted pre small" style={{ textAlign: 'left', marginTop: 2 }}>{e.remarks}</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--surface-tint)' }}>
                    <td><strong>total (weighted)</strong></td><td className="num muted">{JURY_RAW_MAX}</td>
                    {jurors.map((j) => <td key={j.id} className="num"><strong>{show(byJuror.get(j.id)?.total ?? null)}</strong></td>)}
                  </tr>
                  <tr>
                    <td><strong>final verdict</strong></td><td className="num muted" />
                    {jurors.map((j) => {
                      const v = byJuror.get(j.id)?.verdict;
                      return <td key={j.id} className="num">{v ? <Pill tone={v === 'Y' ? 'good' : 'bad'}>{v === 'Y' ? 'yes' : 'no'}</Pill> : <span className="muted">-</span>}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </section>
            </div>
          </div>
        </div>

            <section className="card accent verdict-wide" id="verdict">
              <h2>final verdict</h2>
              <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>this is the admin call. it shows on the snapshot as soon as you save.</p>
              <VerdictForm orgId={org.id} verdict={org.verdict} comment={org.verdictComment ?? ''} />
            </section>
      </div>
      </div>
    </Shell>
  );
}
