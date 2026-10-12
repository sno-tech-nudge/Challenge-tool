'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { requireRole } from './auth/session';
import { hashPassword } from './auth/password';
import { logActivity } from './activity';
import type { Role } from './constants';
import type { FormState } from './actions';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function refresh() {
  revalidatePath('/admin/settings');
  revalidatePath('/admin/settings/activity');
  revalidatePath('/admin');
}

function readIdentity(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
  };
}

function checkIdentity(name: string, email: string): string | null {
  if (!name) return 'enter a name';
  if (name.length > 80) return 'the name is too long';
  if (!EMAIL.test(email)) return 'enter a valid email address as the id';
  return null;
}

/** Admin adds a member (jury by default) with a login id (their email) and a starting password. */
export async function addMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole('ADMIN');
  const { name, email, password } = readIdentity(formData);
  const role: Role = String(formData.get('role')) === 'ADMIN' ? 'ADMIN' : 'JURY';

  const problem = checkIdentity(name, email);
  if (problem) return { error: problem };
  if (password.length < MIN_PASSWORD) return { error: `the password must be at least ${MIN_PASSWORD} characters` };

  try {
    await prisma.user.create({ data: { name, email, role, passwordHash: hashPassword(password) } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { error: 'that id is already in use' };
    throw err;
  }
  await logActivity({ actor: admin, action: 'MEMBER_ADDED', detail: `${name} (${email}), ${role === 'ADMIN' ? 'admin' : 'jury'}` });
  refresh();
  return { ok: true };
}

/** Edit a member's name and id; a non-empty password field also resets their password. */
export async function updateMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole('ADMIN');
  const userId = String(formData.get('userId') ?? '');
  const { name, email, password } = readIdentity(formData);

  const problem = checkIdentity(name, email);
  if (problem) return { error: problem };
  if (password && password.length < MIN_PASSWORD) return { error: `the password must be at least ${MIN_PASSWORD} characters` };

  const before = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!before) return { error: 'that member no longer exists' };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name, email, ...(password ? { passwordHash: hashPassword(password) } : {}) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { error: 'that id is already in use' };
    throw err;
  }

  const changes: string[] = [];
  if (before.name !== name) changes.push(`name ${before.name} → ${name}`);
  if (before.email !== email) changes.push(`id ${before.email} → ${email}`);
  if (changes.length) await logActivity({ actor: admin, action: 'MEMBER_UPDATED', detail: `${before.name}: ${changes.join(', ')}` });
  if (password) await logActivity({ actor: admin, action: 'PASSWORD_RESET', detail: `${name} (${email})` });
  refresh();
  return { ok: true };
}

/** Remove a member. Blocked for yourself, for the last admin, and for anyone who already has
 *  submitted scores (removing them would erase that history). */
export async function deleteMemberAction(userId: string): Promise<FormState> {
  const admin = await requireRole('ADMIN');
  if (userId === admin.id) return { error: 'you cannot remove your own account' };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, _count: { select: { scores: true } } } });
  if (!target) return { error: 'that member no longer exists' };
  if (target.role === 'ADMIN' && (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1) return { error: 'there must be at least one admin' };
  if (target._count.scores > 0) {
    return { error: `${target.name} has submitted ${target._count.scores} review${target._count.scores === 1 ? '' : 's'}, so they cannot be removed. Their scores would be lost.` };
  }

  await prisma.user.delete({ where: { id: userId } });
  await logActivity({ actor: admin, action: 'MEMBER_REMOVED', detail: `${target.name} (${target.email})` });
  refresh();
  return { ok: true };
}
