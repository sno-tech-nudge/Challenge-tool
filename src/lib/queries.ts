import { prisma } from './db';
import { snapshot } from './scoring';

/** Jury list: every org, plus only THIS juror's own total. Other jurors' scores never leave the
 *  server on a jury route. */
export async function listOrgsForJuror(jurorId: string) {
  const orgs = await prisma.org.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slot: true,
      sector: true,
      scores: { where: { jurorId }, select: { total: true } },
    },
  });
  return orgs.map(({ scores, ...o }) => ({ ...o, myTotal: scores[0]?.total ?? null }));
}

export async function getOrgForJuror(orgId: string, jurorId: string) {
  return prisma.org.findUnique({
    where: { id: orgId },
    // verdict fields and other jurors' scores are deliberately not selected
    select: {
      id: true,
      name: true,
      slot: true,
      sector: true,
      location: true,
      website: true,
      summary: true,
      about: true,
      internalQueries: true,
      internalSwot: true,
      ecociateScore: true,
      ecociateRemarks: true,
      scores: { where: { jurorId }, select: { entries: true, total: true } },
    },
  });
}

export async function listSnapshot() {
  const orgs = await prisma.org.findMany({
    orderBy: { name: 'asc' },
    include: { scores: { select: { total: true } } },
  });
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slot: o.slot,
    verdict: o.verdict,
    ...snapshot(o.ecociateScore, o.scores.map((s) => s.total)),
  }));
}

export async function getOrgForAdmin(orgId: string) {
  return prisma.org.findUnique({
    where: { id: orgId },
    include: { scores: { include: { juror: { select: { id: true, name: true } } }, orderBy: { juror: { name: 'asc' } } } },
  });
}

export async function listJurors() {
  return prisma.user.findMany({ where: { role: 'JURY' }, orderBy: { name: 'asc' }, select: { id: true, name: true } });
}

/** Previous / next organisation in the same alphabetical order the lists use. */
export async function orgNeighbours(orgId: string) {
  const ids = (await prisma.org.findMany({ orderBy: { name: 'asc' }, select: { id: true } })).map((o) => o.id);
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
