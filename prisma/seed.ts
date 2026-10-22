// DEV-ONLY seed. Creates one admin, four jurors, and the organisations from data/orgs.json
// (falls back to data/orgs.sample.json, which is fictional). Every account gets the dev password
// from SEED_PASSWORD. Do not use this on a shared or real deployment.
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashPassword } from '../src/lib/auth/password';
import { PARAMETERS, SCORE_MIN, computeTotal } from '../src/lib/rubric';
import { importOrgs, type OrgInput } from './orgImport';

const prisma = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD ?? 'aahaar-dev-1234';

const USERS = [
  { name: 'Admin', email: 'gaurangwadhawan3@gmail.com', role: 'ADMIN' },
  { name: 'Juror 1', email: 'gaurang.wadhawan@thenudge.org', role: 'JURY' },
  { name: 'Juror 2', email: 'juror2@example.test', role: 'JURY' },
  { name: 'Juror 3', email: 'juror3@example.test', role: 'JURY' },
  { name: 'Juror 4', email: 'juror4@example.test', role: 'JURY' },
];

const OVERRIDES: Record<string, string> = {
  'gaurangwadhawan3@gmail.com': 'SEED_PASSWORD_ADMIN',
  'gaurang.wadhawan@thenudge.org': 'SEED_PASSWORD_JUROR1',
};

async function main() {
  for (const u of USERS) {
    // optional per-account override from .env, e.g. SEED_PASSWORD_ADMIN / SEED_PASSWORD_JUROR1
    const passwordHash = hashPassword(process.env[OVERRIDES[u.email] ?? ''] || PASSWORD);
    await prisma.user.upsert({ where: { email: u.email }, create: { ...u, passwordHash }, update: { name: u.name, role: u.role, passwordHash } });
  }

  const real = join(process.cwd(), 'data', 'orgs.json');
  const file = existsSync(real) ? real : join(process.cwd(), 'data', 'orgs.sample.json');
  const orgs = JSON.parse(readFileSync(file, 'utf8')) as OrgInput[];
  await importOrgs(prisma, orgs);
  console.log(`seeded ${USERS.length} users and ${orgs.length} organisations from ${file}`);

  // demo scores only for the fictional sample data, from jurors 2-4, so juror 1 starts with a clean slate
  if (file.endsWith('orgs.sample.json')) {
    const demoJurors = await prisma.user.findMany({ where: { email: { in: ['juror2@example.test', 'juror3@example.test', 'juror4@example.test'] } } });
    const demoOrgs = await prisma.org.findMany({ where: { key: { in: ['test-org-1', 'test-org-2', 'test-org-3'] } } });
    for (const [oi, org] of demoOrgs.entries()) {
      for (const [ji, juror] of demoJurors.entries()) {
        // demo scores out of 10 per criterion, varied a little by organisation and juror
        const entries = PARAMETERS.map((p, pi) => ({ key: p.key, score: Math.max(SCORE_MIN, 9 - ((oi + ji + pi) % 4)), remarks: ji === 0 ? 'sample remark' : '' }));
        const total = computeTotal(Object.fromEntries(entries.map((e) => [e.key, e.score])));
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
