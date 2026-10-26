import type { PrismaClient } from '@prisma/client';

/** One organisation as written in a data file (data/orgs.json or data/orgs.sample.json). `details`
 *  is { sectionKey: Block[] } (see src/lib/orgSections.ts); it is stored as JSON text. */
export interface OrgInput {
  key: string;
  name: string;
  slot?: string;
  /** The interview slot as ISO times with the offset, e.g. "2026-10-27T10:00:00+05:30". null clears it. */
  slotStart?: string | null;
  slotEnd?: string | null;
  sector?: string;
  location?: string;
  website?: string;
  summary?: string;
  about?: string;
  details?: Record<string, unknown>;
  internalQueries?: string;
  internalSwot?: string;
  ecociateScore?: number;
  ecociateRemarks?: string;
}

/** Creates or updates organisations by `key`. Only the fields present in the file are written, so a
 *  later import never wipes a verdict, a jury score or an ecociate score entered in the app. */
export async function importOrgs(prisma: PrismaClient, orgs: OrgInput[]) {
  for (const { details, slotStart, slotEnd, ...rest } of orgs) {
    const when = (v: string | null | undefined, field: string) => {
      if (v === undefined) return {};
      if (v === null) return { [field]: null };
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error(`${rest.key}: ${field} "${v}" is not a valid date and time (use for example 2026-10-27T10:00:00+05:30)`);
      return { [field]: d };
    };
    const data = { ...rest, ...when(slotStart, 'slotStart'), ...when(slotEnd, 'slotEnd'), ...(details ? { details: JSON.stringify(details) } : {}) };
    await prisma.org.upsert({ where: { key: rest.key }, create: data, update: data });
  }
}
