import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth/session';
import { getOrgForJuror, orgNeighbours } from '@/lib/queries';
import { parseEntries } from '@/lib/rubric';
import { ECOCIATE_MAX } from '@/lib/constants';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { ReviewForm } from './ReviewForm';

export const dynamic = 'force-dynamic';

export default async function JuryOrgPage({ params }: { params: { id: string } }) {
  const user = await requireRole('JURY');
  const [org, nav] = await Promise.all([getOrgForJuror(params.id, user.id), orgNeighbours(params.id)]);
  if (!org) notFound();
  const mine = org.scores[0];

  return (
    <Shell user={user}>
      <PageBanner
        eyebrow={org.slot ? `aahaar bazaar challenge · jury review · slot ${org.slot}` : 'aahaar bazaar challenge · jury review'}
        title={org.name}
        actions={mine ? <Pill tone="good">you scored {mine.total}</Pill> : <Pill tone="warn">not scored yet</Pill>}
      />
      <div className="wrap">
        <OrgPager base="/jury" baseLabel="organisations" name={org.name} {...nav} />

        <div className="grid2">
          <div className="stack tall-left" style={{ minWidth: 0 }}>
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

            <section className="card" id="ecociate">
              <h2>ecociate score</h2>
              {org.ecociateScore === null ? (
                <p className="muted">not available yet.</p>
              ) : (
                <p className="big">{org.ecociateScore} <small>/ {ECOCIATE_MAX}</small></p>
              )}
              {org.ecociateRemarks && (
                <>
                  <h3>remarks</h3>
                  <p className="pre">{org.ecociateRemarks}</p>
                </>
              )}
            </section>
          </div>

          <div className="sticky-col" style={{ minWidth: 0 }}>
          <section className="card accent" id="review">
            <h2>start review</h2>
            <p className="hint" style={{ marginBottom: 'var(--space-4)' }}>score all 7 parameters. you can come back and edit until the panel closes.</p>
            <ReviewForm orgId={org.id} existing={mine ? parseEntries(mine.entries) : []} />
          </section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
