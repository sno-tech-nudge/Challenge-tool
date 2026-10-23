import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getOrgForJuror, orgNeighbours } from '@/lib/queries';
import { parseEntries } from '@/lib/rubric';
import { parseDetails } from '@/lib/orgSections';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { OrgDetails } from '@/components/OrgDetails';
import { ReviewForm } from './ReviewForm';

export const dynamic = 'force-dynamic';

export default async function JuryOrgPage({ params }: { params: { id: string } }) {
  const user = await requireRole('JURY');
  const [org, nav] = await Promise.all([getOrgForJuror(params.id, user.id), orgNeighbours(params.id)]);
  if (!org) notFound();
  const mine = org.scores[0];

  return (
    <Shell user={user}>
      <div className="workspace has-footer">
      <PageBanner compact
        eyebrow={org.slot ? `the aahaar bazaar challenge · jury review · slot ${org.slot}` : 'the aahaar bazaar challenge · jury review'}
        title={org.name}
        actions={mine ? <Pill tone="good">you scored {mine.total}</Pill> : <Pill tone="warn">not scored yet</Pill>}
      />
      <div className="wrap">
        <OrgPager
          base="/jury"
          baseLabel="organisations"
          name={org.name}
          {...nav}
          lockedReason={mine ? undefined : 'submit your scores to move to another organisation'}
        />

        <div className="split">
          <div className="pane stack">
            <section className="card accent" id="details">
              <h2>organisation details</h2>
              <OrgDetails website={org.website} idPrefix="j" details={parseDetails(org.details)} />
            </section>

            <section className="card" id="internal">
              <h2>internal remarks</h2>
              {org.internalQueries && (
                <>
                  <h3>queries</h3>
                  <p className="pre">{org.internalQueries}</p>
                </>
              )}
              <h3>your remarks</h3>
              <p className="pre">{mine?.internalRemarks || <span className="muted">none yet. add them in the final verdict section at the bottom of the page.</span>}</p>
            </section>

          </div>

          <div className="pane">
          <section className="card accent" id="review">
            <h2>start review</h2>
            <p className="hint" style={{ marginBottom: 'var(--space-4)' }}>score all 6 criteria. you can come back and edit your scores at any time.</p>
            <ReviewForm orgId={org.id} existing={mine ? parseEntries(mine.entries) : []} existingVerdict={mine?.verdict ?? null} existingRemarks={mine?.internalRemarks ?? ''} />
          </section>
          </div>
        </div>
        <div id="jury-bottom" />
      </div>
      </div>
    </Shell>
  );
}
