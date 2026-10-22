import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getOrgForJuror, orgNeighbours } from '@/lib/queries';
import { parseEntries } from '@/lib/rubric';
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
      <div className="workspace">
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
              <OrgDetails website={org.website} idPrefix="j" />
            </section>

            <section className="card" id="internal">
              <h2>internal remarks</h2>
              <h3>queries</h3>
              <p className="pre">{org.internalQueries || <span className="muted">none</span>}</p>
              <h3>swot</h3>
              <p className="pre">{org.internalSwot || <span className="muted">none</span>}</p>
            </section>

          </div>

          <div className="pane">
          <section className="card accent" id="review">
            <h2>start review</h2>
            <p className="hint" style={{ marginBottom: 'var(--space-4)' }}>score all 7 parameters. you can come back and edit your scores at any time.</p>
            <ReviewForm orgId={org.id} existing={mine ? parseEntries(mine.entries) : []} />
          </section>
          </div>
        </div>
      </div>
      </div>
    </Shell>
  );
}
