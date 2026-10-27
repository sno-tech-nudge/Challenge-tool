import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getOrgForJuror, orgNeighbours } from '@/lib/queries';
import { parseEntries } from '@/lib/rubric';
import { parseDetails } from '@/lib/orgSections';
import { Shell } from '@/components/Shell';
import { PageBanner, Pill } from '@/components/ui';
import { OrgPager } from '@/components/OrgPager';
import { OrgDetails } from '@/components/OrgDetails';
import { InternalQueries } from '@/components/InternalQueries';
import { JurorNotes } from '@/components/JurorNotes';
import { OrgDetailsHeading } from '@/components/OrgDetailsHeading';
import { toJuryScale } from '@/lib/scoring';
import { slotLabel, slotPhase } from '@/lib/slots';
import { JURY_MAX } from '@/lib/constants';
import { SidePanel } from '@/components/SidePanel';
import { RubricGuide } from '@/components/RubricGuide';
import { BookOpen } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

export const dynamic = 'force-dynamic';

export default async function JuryOrgPage({ params }: { params: { id: string } }) {
  const user = await requireRole('JURY');
  const [org, nav] = await Promise.all([getOrgForJuror(params.id, user.id), orgNeighbours(params.id, 'slot')]);
  if (!org) notFound();
  const mine = org.scores[0];
  const now = new Date();
  const phase = slotPhase(org.slotStart, org.slotEnd, now);
  const slot = slotLabel(org);
  // what this juror typed last time without submitting (their own only)
  let draft = null as null | { scores: Record<string, string>; remarks: Record<string, string>; verdict: string; comment: string; savedAt: string };
  const savedDraft = org.reviewDrafts[0];
  if (savedDraft) {
    try {
      const d = JSON.parse(savedDraft.data);
      if (d && typeof d.scores === 'object' && typeof d.remarks === 'object') draft = { scores: d.scores, remarks: d.remarks, verdict: d.verdict ?? '', comment: d.comment ?? '', savedAt: savedDraft.updatedAt.toISOString() };
    } catch {
      draft = null;
    }
  }

  return (
    <Shell user={user}>
      <div className="workspace has-footer">
      <PageBanner compact
        eyebrow={slot ? `the aahaar bazaar challenge · jury review · slot ${slot}` : 'the aahaar bazaar challenge · jury review'}
        title={org.name}
        actions={mine ? <Pill tone="good">you scored {toJuryScale(mine.total)} / {JURY_MAX}</Pill> : <Pill tone="warn">not scored yet</Pill>}
      />
      <div className="wrap">
        <OrgPager
          base="/jury"
          baseLabel="organisations"
          name={org.name}
          {...nav}
          lockedReason={mine || phase === 'before' ? undefined : 'submit your scores to move to another organisation'}
        />

        <div className="split">
          <div className="pane stack">
            <section className="card accent" id="details">
              <OrgDetailsHeading orgId={org.id} hasFactsheet={Boolean(org.factsheet)} />
              <OrgDetails website={org.website} idPrefix="j" details={parseDetails(org.details)} />
            </section>

            <section className="card" id="internal">
              <h2>internal remarks</h2>
              <InternalQueries text={org.internalQueries} />
            </section>

            <JurorNotes orgId={org.id} initial={org.jurorNotes[0]?.text ?? ''} />

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
          <section className="card accent" id="review">
            <h2>start review</h2>
            <ReviewForm
              orgId={org.id}
              existing={mine ? parseEntries(mine.entries) : []}
              existingVerdict={mine?.verdict ?? null}
              existingRemarks={mine?.internalRemarks ?? ''}
              slotStart={org.slotStart?.toISOString() ?? null}
              slotEnd={org.slotEnd?.toISOString() ?? null}
              serverNow={now.toISOString()}
              draft={draft}
            />
          </section>
          </div>
          </div>
        </div>
        <div id="jury-bottom" />
      </div>
      </div>
    </Shell>
  );
}
