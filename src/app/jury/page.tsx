import { requireRole } from '@/lib/auth/session';
import { listOrgsForJuror } from '@/lib/queries';
import { Shell } from '@/components/Shell';
import { PageBanner } from '@/components/ui';
import { JuryTable } from './JuryTable';

export const dynamic = 'force-dynamic';

export default async function JuryList() {
  const user = await requireRole('JURY');
  const orgs = await listOrgsForJuror(user.id);
  const done = orgs.filter((o) => o.myTotal !== null).length;

  return (
    <Shell user={user}>
      <PageBanner
        eyebrow="aahaar bazaar challenge · jury review"
        title="organisations"
        subtitle={`${done} of ${orgs.length} reviewed by you. open an organisation to read it and score it.`}
      />
      <div className="wrap">
        <JuryTable orgs={orgs} done={done} />
      </div>
    </Shell>
  );
}
