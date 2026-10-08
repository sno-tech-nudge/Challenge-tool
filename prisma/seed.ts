// DEV-ONLY seed. Creates one admin, four jurors, and the organisations from data/orgs.json
// (falls back to data/orgs.sample.json, which is fictional). Every account gets the dev password
// from SEED_PASSWORD. Do not use this on a shared or real deployment.
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashPassword } from '../src/lib/auth/password';
import { PARAMETERS } from '../src/lib/rubric';

const prisma = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD ?? 'midline-dev-1234';

const USERS = [
  { name: 'Admin', email: 'gaurangwadhawan3@gmail.com', role: 'ADMIN' },
  { name: 'Juror 1', email: 'gaurang.wadhawan@thenudge.org', role: 'JURY' },
  { name: 'Juror 2', email: 'juror2@example.test', role: 'JURY' },
  { name: 'Juror 3', email: 'juror3@example.test', role: 'JURY' },
  { name: 'Juror 4', email: 'juror4@example.test', role: 'JURY' },
];

interface OrgInput {
  key: string;
  name: string;
  slot?: string;
  sector?: string;
  location?: string;
  website?: string;
  summary?: string;
  about?: string;
  internalQueries?: string;
  internalSwot?: string;
  ecociateScore?: number;
  ecociateRemarks?: string;
}

async function main() {
  const passwordHash = hashPassword(PASSWORD);
  for (const u of USERS) {
    await prisma.user.upsert({ where: { email: u.email }, create: { ...u, passwordHash }, update: { name: u.name, role: u.role, passwordHash } });
  }

  const real = join(process.cwd(), 'data', 'orgs.json');
  const file = existsSync(real) ? real : join(process.cwd(), 'data', 'orgs.sample.json');
  const orgs = JSON.parse(readFileSync(file, 'utf8')) as OrgInput[];
  for (const o of orgs) {
    await prisma.org.upsert({ where: { key: o.key }, create: o, update: o });
  }
  console.log(`seeded ${USERS.length} users and ${orgs.length} organisations from ${file}`);

  // demo scores only for the fictional sample data, from jurors 2-4, so juror 1 starts with a clean slate
  if (file.endsWith('orgs.sample.json')) {
    const demoJurors = await prisma.user.findMany({ where: { email: { in: ['juror2@example.test', 'juror3@example.test', 'juror4@example.test'] } } });
    const demoOrgs = await prisma.org.findMany({ where: { key: { in: ['test-org-1', 'test-org-2', 'test-org-3'] } } });
    for (const [oi, org] of demoOrgs.entries()) {
      for (const [ji, juror] of demoJurors.entries()) {
        const entries = PARAMETERS.map((p) => ({ key: p.key, score: Math.max(0, p.max - ((oi + ji) % 3)), remarks: ji === 0 ? 'sample remark' : '' }));
        const total = entries.reduce((s, e) => s + e.score, 0);
        await prisma.juryScore.upsert({
          where: { orgId_jurorId: { orgId: org.id, jurorId: juror.id } },
          create: { orgId: org.id, jurorId: juror.id, entries: JSON.stringify(entries), total },
          update: { entries: JSON.stringify(entries), total },
        });
      }
    }
    console.log('added demo jury scores for test-org-1..3');
  }
}

main().finally(() => prisma.$disconnect());
