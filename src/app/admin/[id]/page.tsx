import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getOrgForAdmin, listJurors, orgNeighbours } from '@/lib/queries';
import { PARAMETERS, parseEntries } from '@/lib/rubric';
import { snapshot, toJuryScale } from '@/lib/scoring';
import { slotLabel } from '@/lib/slots';
import { parseDetails } from '@/lib/orgSections';
import { ECOCIATE_MAX, JURY_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill, ScoreBar, scoreTone } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { OrgDetails } from '@/components/OrgDetails';
import { InternalQueries } from '@/components/InternalQueries';
import { RemarkTip } from '@/components/RemarkTip';
import { SidePanel } from '@/components/SidePanel';
import { RubricGuide } from '@/components/RubricGuide';
import { BookOpen } from 'lucide-react';
import { OrgDetailsHeading } from '@/components/OrgDetailsHeading';
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
        eyebrow={slotLabel(org) ? `the aahaar bazaar challenge · score card · slot ${slotLabel(org)}` : 'the aahaar bazaar challenge · score card'}
        title={org.name}
        actions={org.verdict ? <Pill tone={org.verdict === 'Y' ? 'good' : 'bad'}>verdict: {org.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <Pill tone="warn">verdict pending</Pill>}
      />
      <div className="wrap">
        <OrgPager base="/admin" baseLabel="snapshot" name={org.name} {...nav} />

        <div className="split even">
          <div className="pane stack">
            <section className="card accent" id="details">
              <OrgDetailsHeading orgId={org.id} hasFactsheet={Boolean(org.factsheet)} />
              <OrgDetails website={org.website} idPrefix="a" details={parseDetails(org.details)} />
            </section>
            <section className="card" id="internal">
              <h2>internal remarks</h2>
              <InternalQueries text={org.internalQueries} />
              <h3>jury comments</h3>
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
              <section className="card guide-card" id="guide">
                <div className="row" style={{ alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>scoring guide</h2>
                    <p className="hint" style={{ marginTop: 2 }}>the rubric, the scale and the questions behind each criterion.</p>
                  </div>
                  <SidePanel label="open scoring guide" title="scoring guide" icon={<BookOpen size={14} strokeLinejoin="miter" strokeLinecap="square" />}>
                    <RubricGuide />
                  </SidePanel>
                </div>
              </section>
              <section className="card accent" id="ecociate">
                <h2>ecociate score and reasoning</h2>
                <EcociateForm orgId={org.id} score={org.ecociateScore} remarks={org.ecociateRemarks ?? ''} />
              </section>
            <section className="card scroll" id="jury" style={{ padding: 0 }}>
              <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}><h2 style={{ margin: 0 }}>scores by juror</h2><p className="hint" style={{ marginTop: 4 }}>each score is out of 10; the total is weighted out of {JURY_MAX}.</p></div>
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
                            <span className="score-cell">
                              {e ? e.score : <span className="muted">-</span>}
                              {e?.remarks ? <RemarkTip text={e.remarks} juror={j.name} /> : <span className="remark-spacer" aria-hidden="true" />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>total (weighted)</strong></td><td className="num muted">{JURY_MAX}</td>
                    {jurors.map((j) => { const t = byJuror.get(j.id)?.total; return <td key={j.id} className="num"><span className="score-cell"><strong>{t === undefined ? '-' : toJuryScale(t)}</strong><span className="remark-spacer" aria-hidden="true" /></span></td>; })}
                  </tr>
                  <tr>
                    <td><strong>final verdict</strong></td><td className="num muted" />
                    {jurors.map((j) => {
                      const v = byJuror.get(j.id)?.verdict;
                      return <td key={j.id} className="num"><span className="score-cell">{v ? <Pill tone={v === 'Y' ? 'good' : 'bad'}>{v === 'Y' ? 'yes' : 'no'}</Pill> : <span className="muted">-</span>}<span className="remark-spacer" aria-hidden="true" /></span></td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </section>
              <section className="card accent" id="final">
                <h2>final score</h2>
                <div className="final-row">
                  <div>
                    <div className="final-label">ecociate</div>
                    <div className="final-val">{show(snap.ecociate)} <small>/ {ECOCIATE_MAX}</small></div>
                    <div className="final-note">M&amp;E findings</div>
                  </div>
                  <div>
                    <div className="final-label">scores by juror</div>
                    <div className="final-val">{show(snap.juryAvg)} <small>/ {JURY_MAX}</small></div>
                    <div className="final-note">average of {snap.juryCount} {snap.juryCount === 1 ? 'juror' : 'jurors'}</div>
                  </div>
                  <div>
                    <div className="final-label">final score</div>
                    <div className={`final-val${finalTone ? ` tone-${finalTone}` : ''}`}>{show(snap.final)} <small>/ 100</small></div>
                    <div className="final-note">ecociate + scores by juror</div>
                  </div>
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}><ScoreBar value={snap.final} max={100} /></div>
                {snap.final === null && <p className="hint" style={{ marginTop: 'var(--space-2)' }}>the final score appears once the ecociate score is fed and at least one juror has scored.</p>}
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
