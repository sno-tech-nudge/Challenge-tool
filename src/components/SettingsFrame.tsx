import type { User } from '@prisma/client';
import { Shell } from './Shell';
import { PageBanner } from './ui';
import { SettingsTabs } from './SettingsTabs';

/** Shared page frame for the admin settings screens: banner, tab bar, content area. */
export function SettingsFrame({ user, subtitle, children }: { user: User; subtitle?: string; children: React.ReactNode }) {
  return (
    <Shell user={user}>
      <PageBanner eyebrow="aahaar bazaar challenge · admin" title="settings" subtitle={subtitle} />
      <div className="wrap stack">
        <SettingsTabs />
        {children}
      </div>
    </Shell>
  );
}
