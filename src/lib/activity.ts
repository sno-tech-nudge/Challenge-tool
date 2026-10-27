import { prisma } from './db';

export const ACTIVITY_ACTIONS = {
  REVIEW_SUBMITTED: 'review submitted',
  REVIEW_UPDATED: 'review updated',
  REVIEW_CLEARED: 'review cleared',
  VERDICT_CHANGED: 'verdict changed',
  ECOCIATE_CHANGED: 'ecociate score changed',
  MEMBER_ADDED: 'member added',
  MEMBER_UPDATED: 'member updated',
  PASSWORD_RESET: 'password reset',
  MEMBER_REMOVED: 'member removed',
} as const;
export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;

/** Writes one activity row. Logging must never break the action it describes, so a failure here is
 *  reported to the server log and swallowed. Never put passwords or hashes in `detail`. */
export async function logActivity(entry: {
  actor: { id: string; name: string };
  action: ActivityAction;
  org?: { id: string; name: string } | null;
  detail?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: entry.actor.id,
        actorName: entry.actor.name,
        action: entry.action,
        orgId: entry.org?.id ?? null,
        orgName: entry.org?.name ?? null,
        detail: entry.detail ?? null,
      },
    });
  } catch (err) {
    console.error('activity log write failed', err);
  }
}

export const PAGE_SIZE = 50;

export async function listActivity(opts: { action?: string; actor?: string; page?: number }) {
  const where = {
    ...(opts.action && opts.action in ACTIVITY_ACTIONS ? { action: opts.action } : {}),
    ...(opts.actor ? { actorId: opts.actor } : {}),
  };
  const page = Math.max(1, opts.page ?? 1);
  const [rows, total, actors] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { at: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.activityLog.count({ where }),
    // one entry per person, under the name they have now (a renamed person must not appear twice)
    prisma.activityLog.findMany({ distinct: ['actorId'], orderBy: { at: 'desc' }, select: { actorId: true, actorName: true } }),
  ]);
  return {
    rows,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    actors: (actors.filter((a) => a.actorId) as { actorId: string; actorName: string }[]).sort((x, y) => x.actorName.localeCompare(y.actorName, 'en', { sensitivity: 'base' })),
  };
}
