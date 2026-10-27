import { prisma } from './db';
import { snapshot } from './scoring';
import { compareBySlot, slotLabel } from './slots';

/** Alphabetical, ignoring case, so a name like "bettrlabs" sits among the others. The database sorts
 *  upper case before lower case, so lists are ordered here instead. */
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

/** Jury list: every org, plus only THIS juror's own total. Other jurors' scores never leave the
 *  server on a jury route. */
export async function listOrgsForJuror(jurorId: string) {
  const orgs = (await prisma.org.findMany({
    select: {
      id: true,
      name: true,
      slot: true,
      slotStart: true,
      slotEnd: true,
      sector: true,
      scores: { where: { jurorId }, select: { total: true } },
    },
  })).sort(compareBySlot);
  // earliest slot first; the dates travel to the browser as text
  return orgs.map(({ scores, slotStart, slotEnd, slot, ...o }) => ({
    ...o,
    slot: slotLabel({ slot, slotStart, slotEnd }),
    slotStart: slotStart?.toISOString() ?? null,
    slotEnd: slotEnd?.toISOString() ?? null,
    myTotal: scores[0]?.total ?? null,
  }));
}

export async function getOrgForJuror(orgId: string, jurorId: string) {
  return prisma.org.findUnique({
    where: { id: orgId },
    // verdict fields and other jurors' scores are deliberately not selected
    select: {
      id: true,
      name: true,
      slot: true,
      slotStart: true,
      slotEnd: true,
      sector: true,
      location: true,
      website: true,
      summary: true,
      about: true,
      details: true,
      internalQueries: true,
      factsheet: { select: { orgId: true } },
      jurorNotes: { where: { jurorId }, select: { text: true } },
      reviewDrafts: { where: { jurorId }, select: { data: true, updatedAt: true } },
      scores: { where: { jurorId }, select: { entries: true, total: true, verdict: true, internalRemarks: true, rescoreCount: true } },
    },
  });
}

export async function listSnapshot() {
  const orgs = (await prisma.org.findMany({
    include: { scores: { select: { total: true, rescoredAt: true } } },
  })).sort(byName);
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slot: slotLabel(o),
    verdict: o.verdict,
    rescored: o.scores.filter((s) => s.rescoredAt).length,
    ...snapshot(o.ecociateScore, o.scores.map((s) => s.total)),
  }));
}

export async function getOrgForAdmin(orgId: string) {
  return prisma.org.findUnique({
    where: { id: orgId },
    include: { factsheet: { select: { orgId: true } }, scores: { include: { juror: { select: { id: true, name: true } } }, orderBy: { juror: { name: 'asc' } } } },
  });
}

export async function listJurors() {
  return prisma.user.findMany({ where: { role: 'JURY' }, orderBy: { name: 'asc' }, select: { id: true, name: true } });
}

/** Previous / next organisation in the order the list uses: alphabetical for admins, by slot for jurors. */
export async function orgNeighbours(orgId: string, order: 'name' | 'slot' = 'name') {
  const all = await prisma.org.findMany({ select: { id: true, name: true, slotStart: true } });
  const ids = all.sort(order === 'slot' ? compareBySlot : byName).map((o) => o.id);
  const i = ids.indexOf(orgId);
  return {
    prevId: i > 0 ? ids[i - 1] : null,
    nextId: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null,
    position: i + 1,
    total: ids.length,
  };
}

/** How many organisations each juror has scored, for the admin overview. */
export async function jurorProgress() {
  const jurors = await prisma.user.findMany({
    where: { role: 'JURY' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { scores: true } } },
  });
  return jurors.map((j) => ({ id: j.id, name: j.name, scored: j._count.scores }));
}

/** Everyone who can sign in, with how many reviews each has submitted. */
export async function listTeam() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, _count: { select: { scores: true } } },
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, reviews: u._count.scores }));
}

/** Reviews that a juror rescored in the last week, newest first: what the admin is told about. */
export async function recentRescores() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return prisma.juryScore.findMany({
    where: { rescoredAt: { gte: since } },
    orderBy: { rescoredAt: 'desc' },
    take: 12,
    select: { orgId: true, total: true, previousTotal: true, rescoredAt: true, rescoreCount: true, juror: { select: { name: true } }, org: { select: { name: true } } },
  });
}
