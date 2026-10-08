import Link from 'next/link';
import { BookOpen, LogOut } from 'lucide-react';
import type { User } from '@prisma/client';
import { logoutAction } from '@/lib/auth/actions';
import { SidePanel } from './SidePanel';
import { RubricGuide } from './RubricGuide';
import { ThemeToggle } from './ThemeToggle';
import { NavLinks } from './NavLinks';

export function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const isAdmin = user.role === 'ADMIN';
  const home = isAdmin ? '/admin' : '/jury';
  const items = isAdmin ? [{ href: '/admin', label: 'snapshot' }] : [{ href: '/jury', label: 'organisations' }];

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link href={home} className="brand" aria-label="aahaar bazaar challenge home">
            <span className="brand-mark" aria-hidden="true">A</span>
            aahaar bazaar challenge
          </Link>
          <NavLinks items={items} />
        </div>
        <div className="header-right">
          <SidePanel label="scoring guide" title="scoring guide" icon={<BookOpen size={14} strokeLinejoin="miter" strokeLinecap="square" />}>
            <RubricGuide />
          </SidePanel>
          <ThemeToggle />
          <div className="who">
            <span className="who-name" title={user.name}>{user.name}</span>
            <span className="pill">{isAdmin ? 'admin' : 'jury'}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn ghost sm">
                <LogOut size={14} strokeLinejoin="miter" strokeLinecap="square" />
                <span className="btn-label">log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
