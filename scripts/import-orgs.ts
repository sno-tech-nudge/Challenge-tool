// Loads organisations into the database from a data file, and can remove organisations by key.
// It never touches users, passwords or scores of organisations that are kept.
//
//   npm run db:import-orgs                      imports data/orgs.json
//   npm run db:import-orgs -- some/file.json    imports another file
//   npm run db:import-orgs -- --delete test-org-1,test-org-2
//
// Real organisation data belongs in data/orgs.json, which is git-ignored on purpose.
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { importOrgs, type OrgInput } from '../prisma/orgImport';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const delIdx = args.indexOf('--delete');
  const toDelete = delIdx >= 0 ? (args[delIdx + 1] ?? '').split(',').map((k) => k.trim()).filter(Boolean) : [];
  const fileArg = args.find((a, i) => !a.startsWith('--') && i !== delIdx + 1);

  if (toDelete.length) {
    const found = await prisma.org.findMany({ where: { key: { in: toDelete } }, select: { key: true, name: true } });
    const res = await prisma.org.deleteMany({ where: { key: { in: toDelete } } });
    console.log(`deleted ${res.count} organisation(s) (their scores go with them):`, found.map((o) => o.name).join(', ') || 'none found');
  }

  const file = fileArg ?? join(process.cwd(), 'data', 'orgs.json');
  if (!fileArg && toDelete.length && !existsSync(file)) return; // delete-only run
  if (!existsSync(file)) throw new Error(`no data file at ${file}`);
  const orgs = JSON.parse(readFileSync(file, 'utf8')) as OrgInput[];
  await importOrgs(prisma, orgs);
  console.log(`imported ${orgs.length} organisation(s) from ${file}:`, orgs.map((o) => o.name).join(', '));
}

main().finally(() => prisma.$disconnect());
