import { requireRole } from '@/lib/auth/session';
import { listTeam } from '@/lib/queries';
import { SettingsFrame } from '@/components/SettingsFrame';
import { TeamManager } from './TeamManager';

export const dynamic = 'force-dynamic';

export default async function SettingsTeamPage() {
  const user = await requireRole('ADMIN');
  const members = await listTeam();
  return (
    <SettingsFrame user={user} subtitle="add jurors and admins, set their login id and password.">
      <TeamManager members={members} currentUserId={user.id} />
    </SettingsFrame>
  );
}
