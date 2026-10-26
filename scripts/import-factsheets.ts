// Loads organisation factsheets (PDF) into the database, one file per organisation.
//
//   npm run db:import-factsheets            reads every data/factsheets/<org key>.pdf
//
// The file name is the organisation's key (for example win-win-bites.pdf). The PDFs hold real
// organisation data, so data/factsheets is git-ignored on purpose.
import { PrismaClient } from '@prisma/client';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

async function main() {
  const dir = join(process.cwd(), 'data', 'factsheets');
  if (!existsSync(dir)) throw new Error(`no folder at ${dir}`);
  for (const file of readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'))) {
    const key = file.replace(/\.pdf$/i, '');
    const org = await prisma.org.findUnique({ where: { key }, select: { id: true, name: true } });
    if (!org) {
      console.log(`skipped ${file}: no organisation with key "${key}"`);
      continue;
    }
    const pdf = readFileSync(join(dir, file));
    await prisma.orgFactsheet.upsert({ where: { orgId: org.id }, create: { orgId: org.id, pdf }, update: { pdf } });
    console.log(`loaded factsheet for ${org.name} (${Math.round(pdf.length / 1024)} KB)`);
  }
}

main().finally(() => prisma.$disconnect());
