'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  // /admin is also the prefix of /admin/settings, so the most specific (longest) matching link wins
  const active = items
    .filter((it) => path === it.href || path.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="nav" aria-label="main">
      {items.map((it) => (
        <Link key={it.href} href={it.href} aria-current={it.href === active ? 'page' : undefined}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
