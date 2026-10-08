import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth/session';
import { getOrgForAdmin, listJurors, orgNeighbours } from '@/lib/queries';
import { PARAMETERS, parseEntries } from '@/lib/rubric';
import { snapshot } from '@/lib/scoring';
import { ECOCIATE_MAX, JURY_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill, ScoreBar } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { VerdictForm, EcociateForm } from './AdminForms';

export const dynamic = 'force-dynamic';

const show = (n: number | null) => (n === null ? '-' : String(n));

export default async function AdminOrgPage({ params }: { params: { id: string } }) {
  const user = await requireRole('ADMIN');
  const [org, jurors, nav] = await Promise.all([getOrgForAdmin(params.id), listJurors(), orgNeighbours(params.id)]);
  if (!org) notFound();

  const snap = snapshot(org.ecociateScore, org.scores.map((s) => s.total));
  // one column per juror account, so a juror who has not scored yet still shows as an empty column
  const byJuror = new Map(org.scores.map((s) => [s.jurorId, { total: s.total, entries: new Map(parseEntries(s.entries).map((e) => [e.key, e])) }]));
  const meta = [org.sector, org.location].filter(Boolean).join(' · ');

  return (
    <Shell user={user}>
      <PageBanner
        eyebrow={org.slot ? `score card · slot ${org.slot}` : 'score card'}
        title={org.name}
        subtitle={meta || undefined}
        actions={org.verdict ? <Pill tone={org.verdict === 'Y' ? 'good' : 'bad'}>verdict: {org.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <Pill tone="warn">verdict pending</Pill>}
      />
      <div className="wrap">
        <OrgPager base="/admin" baseLabel="snapshot" name={org.name} {...nav} />

        <div className="grid2">
          <div className="stack" style={{ minWidth: 0 }}>
            <section className="card accent" id="details">
              <h2>organisation details</h2>
              {org.website && (
                <p className="small" style={{ marginBottom: 'var(--space-3)' }}>
                  <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {org.website} <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </p>
              )}
              {org.summary && <p className="pre" style={{ fontWeight: 600 }}>{org.summary}</p>}
              {org.about ? <p className="pre" style={{ marginTop: 'var(--space-3)' }}>{org.about}</p> : !org.summary && <p className="muted">no details added yet.</p>}
            </section>
            <section className="card" id="internal">
              <h2>internal remarks</h2>
              <h3>queries</h3>
              <p className="pre">{org.internalQueries || <span className="muted">none</span>}</p>
              <h3>swot</h3>
              <p className="pre">{org.internalSwot || <span className="muted">none</span>}</p>
            </section>
          </div>

          <div className="stack" style={{ minWidth: 0 }}>
            <section className="card accent" id="scores">
              <h2>scores</h2>
              <div className="row" style={{ alignItems: 'center' }}><span>ecociate</span><span className="big">{show(snap.ecociate)} <small>/ {ECOCIATE_MAX}</small></span></div>
              <div className="row" style={{ alignItems: 'center', marginTop: 'var(--space-2)' }}><span>jury average <span className="muted small">({snap.juryCount} jurors)</span></span><span className="big">{show(snap.juryAvg)} <small>/ {JURY_MAX}</small></span></div>
              <div className="row" style={{ alignItems: 'center', borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)' }}>
                <strong>final score</strong><span className="big">{show(snap.final)} <small>/ 100</small></span>
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}><ScoreBar value={snap.final} max={100} /></div>
              {snap.final === null && <p className="hint" style={{ marginTop: 'var(--space-2)' }}>the final score appears once the ecociate score is fed and at least one juror has scored.</p>}
            </section>
            <section className="card" id="ecociate">
              <h2>ecociate score and reasoning</h2>
              <EcociateForm orgId={org.id} score={org.ecociateScore} remarks={org.ecociateRemarks ?? ''} />
            </section>
          </div>
        </div>

        <section className="card scroll" id="jury" style={{ marginTop: 'var(--space-6)', padding: 0 }}>
          <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}><h2 style={{ margin: 0 }}>jury scores by juror</h2></div>
          <table>
            <thead>
              <tr>
                <th>parameter</th><th className="num">max</th>
                {jurors.map((j) => <th key={j.id} className="num">{j.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {PARAMETERS.map((p) => (
                <tr key={p.key}>
                  <td>{p.label}</td>
                  <td className="num muted">{p.max}</td>
                  {jurors.map((j) => {
                    const e = byJuror.get(j.id)?.entries.get(p.key);
                    return (
                      <td key={j.id} className="num" style={{ minWidth: 110 }}>
                        {e ? e.score : <span className="muted">-</span>}
                        {e?.remarks && <div className="muted pre small" style={{ textAlign: 'left', marginTop: 2 }}>{e.remarks}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ background: 'var(--surface-tint)' }}>
                <td><strong>total</strong></td><td className="num muted">{JURY_MAX}</td>
                {jurors.map((j) => <td key={j.id} className="num"><strong>{show(byJuror.get(j.id)?.total ?? null)}</strong></td>)}
              </tr>
            </tbody>
          </table>
        </section>

        <section className="card accent" id="verdict" style={{ marginTop: 'var(--space-6)' }}>
          <h2>final verdict</h2>
          <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>this is the admin call. it shows on the snapshot as soon as you save.</p>
          <VerdictForm orgId={org.id} verdict={org.verdict} comment={org.verdictComment ?? ''} />
        </section>
      </div>
    </Shell>
  );
}
