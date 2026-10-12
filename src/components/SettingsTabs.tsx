'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/settings', label: 'team' },
  { href: '/admin/settings/activity', label: 'activity log' },
];

export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="settings sections">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
