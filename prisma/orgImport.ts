import type { PrismaClient } from '@prisma/client';

/** One organisation as written in a data file (data/orgs.json or data/orgs.sample.json). `details`
 *  is { sectionKey: Block[] } (see src/lib/orgSections.ts); it is stored as JSON text. */
export interface OrgInput {
  key: string;
  name: string;
  slot?: string;
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
  for (const { details, ...rest } of orgs) {
    const data = { ...rest, ...(details ? { details: JSON.stringify(details) } : {}) };
    await prisma.org.upsert({ where: { key: rest.key }, create: data, update: data });
  }
}
