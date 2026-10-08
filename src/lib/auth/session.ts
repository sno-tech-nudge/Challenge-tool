import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@prisma/client';
import { prisma } from '../db';
import { SESSION_COOKIE, type Role } from '../constants';
import { verifySession } from './token';

/** Who is signed in, loaded from the database (the role in the cookie is only a routing hint). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.userId } });
});

/** Page/action guard: redirects to /login when signed out or to / when the role does not match. */
export async function requireRole(role: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== role) redirect('/');
  return user;
}
