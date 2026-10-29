import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { PARAMETERS, SCORE_MAX, parseEntries } from '@/lib/rubric';
import { JURY_MAX } from '@/lib/constants';
import { toJuryScale } from '@/lib/scoring';
import { formatMoment } from '@/lib/slots';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** A spreadsheet cell: quoted, and a leading = + - @ is defused so a juror's text can never run as a formula. */
function cell(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v !== 'number') s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Every juror's notes, and once they have submitted, their scores and remarks per criterion, in one CSV
 *  (one row per organisation and juror). Admin only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response('sign in first', { status: 401 });
  if (user.role !== 'ADMIN') return new Response('only admins can export jury data', { status: 403 });

  const [orgs, notes, reviews] = await Promise.all([
    prisma.org.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.jurorNote.findMany({ include: { juror: { select: { name: true } } } }),
    prisma.juryScore.findMany({ include: { juror: { select: { name: true } } } }),
  ]);

  // one row per organisation and juror who has a note, a submitted review, or both
  const rows = new Map<string, { org: string; juror: string; note?: string; noteAt?: Date; review?: (typeof reviews)[number] }>();
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const get = (orgId: string, jurorId: string, jurorName: string) => {
    const k = `${orgId}|${jurorId}`;
    if (!rows.has(k)) rows.set(k, { org: orgName.get(orgId) ?? '', juror: jurorName });
    return rows.get(k)!;
  };
  for (const n of notes) Object.assign(get(n.orgId, n.jurorId, n.juror.name), { note: n.text, noteAt: n.updatedAt });
  for (const r of reviews) get(r.orgId, r.jurorId, r.juror.name).review = r;

  const header = [
    'organisation', 'juror', 'notes', 'notes last edited (IST)', 'review submitted',
    ...PARAMETERS.flatMap((p, i) => [`${i + 1}. ${p.label} | score (out of ${SCORE_MAX})`, `${i + 1}. ${p.label} | remarks`]),
    `juror total (out of ${JURY_MAX})`, 'verdict', 'comment', 'times rescored',
  ];
  const lines = [header.map(cell).join(',')];
  const sorted = [...rows.values()].sort((a, b) => a.org.localeCompare(b.org, 'en', { sensitivity: 'base' }) || a.juror.localeCompare(b.juror, 'en', { sensitivity: 'base' }));
  for (const r of sorted) {
    const entries = r.review ? parseEntries(r.review.entries) : [];
    const byKey = new Map(entries.map((e) => [e.key, e]));
    lines.push([
      r.org, r.juror, r.note ?? '', r.noteAt ? formatMoment(r.noteAt) : '', r.review ? 'yes' : 'no',
      ...PARAMETERS.flatMap((p) => [byKey.get(p.key)?.score ?? '', byKey.get(p.key)?.remarks ?? '']),
      r.review ? toJuryScale(r.review.total) : '',
      r.review ? (r.review.verdict === 'Y' ? 'yes' : r.review.verdict === 'N' ? 'no' : '') : '',
      r.review?.internalRemarks ?? '', r.review?.rescoreCount ?? '',
    ].map(cell).join(','));
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="jury-notes-and-scores-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
