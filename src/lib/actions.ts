'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { requireRole } from './auth/session';
import { PARAMETERS, SCORE_MIN, SCORE_MAX, SCORE_STEP, computeTotal, type ScoreEntry } from './rubric';
import { ECOCIATE_MAX, JURY_RAW_MAX } from './constants';
import { logActivity } from './activity';

export interface FormState {
  error?: string;
  ok?: boolean;
}

const verdictWord = (v: string | null) => (v === 'Y' ? 'yes' : v === 'N' ? 'no' : 'undecided');

function refreshOrg(orgId: string) {
  revalidatePath('/jury');
  revalidatePath(`/jury/${orgId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/${orgId}`);
  revalidatePath('/admin/settings/activity');
}

/** Juror saves (or re-saves) their own review. The juror id always comes from the session, never
 *  from the form, so nobody can write a score as someone else. */
export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole('JURY');
  const orgId = String(formData.get('orgId') ?? '');
  const org = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true, name: true } });
  if (!org) return { error: 'organisation not found' };

  const entries: ScoreEntry[] = [];
  for (const p of PARAMETERS) {
    const raw = String(formData.get(`score_${p.key}`) ?? '').trim();
    const score = Number(raw);
    // a whole or half point from SCORE_MIN to SCORE_MAX
    if (raw === '' || !Number.isFinite(score) || score < SCORE_MIN || score > SCORE_MAX || Math.round(score / SCORE_STEP) * SCORE_STEP !== score) {
      return { error: `${p.label} enter a score from ${SCORE_MIN} to ${SCORE_MAX} (in steps of ${SCORE_STEP})` };
    }
    entries.push({ key: p.key, score, remarks: String(formData.get(`remarks_${p.key}`) ?? '').trim() });
  }
  // each score is out of 10; the stored total is the weighted total out of 100
  const total = computeTotal(Object.fromEntries(entries.map((e) => [e.key, e.score])));

  const previous = await prisma.juryScore.findUnique({ where: { orgId_jurorId: { orgId, jurorId: user.id } }, select: { total: true } });
  await prisma.juryScore.upsert({
    where: { orgId_jurorId: { orgId, jurorId: user.id } },
    create: { orgId, jurorId: user.id, entries: JSON.stringify(entries), total },
    update: { entries: JSON.stringify(entries), total },
  });
  await logActivity({
    actor: user,
    action: previous ? 'REVIEW_UPDATED' : 'REVIEW_SUBMITTED',
    org,
    detail: previous ? `total ${previous.total} → ${total} / ${JURY_RAW_MAX}` : `total ${total} / ${JURY_RAW_MAX}`,
  });
  refreshOrg(orgId);
  return { ok: true };
}

/** Juror withdraws their own review of one organisation (back to "not scored"). */
export async function clearReviewAction(orgId: string): Promise<FormState> {
  const user = await requireRole('JURY');
  const existing = await prisma.juryScore.findUnique({
    where: { orgId_jurorId: { orgId, jurorId: user.id } },
    select: { total: true, org: { select: { id: true, name: true } } },
  });
  await prisma.juryScore.deleteMany({ where: { orgId, jurorId: user.id } });
  if (existing) await logActivity({ actor: user, action: 'REVIEW_CLEARED', org: existing.org, detail: `was ${existing.total} / ${JURY_RAW_MAX}` });
  refreshOrg(orgId);
  return { ok: true };
}

/** Admin records the final Y/N call and rationale; the snapshot reads it straight from the org. */
export async function setVerdictAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole('ADMIN');
  const orgId = String(formData.get('orgId') ?? '');
  const v = String(formData.get('verdict') ?? '');
  const verdict = v === 'Y' || v === 'N' ? v : null;
  const comment = String(formData.get('comment') ?? '').trim() || null;

  const before = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true, name: true, verdict: true, verdictComment: true } });
  if (!before) return { error: 'organisation not found' };

  await prisma.org.update({ where: { id: orgId }, data: { verdict, verdictComment: comment, verdictAt: verdict ? new Date() : null } });

  const verdictChanged = before.verdict !== verdict;
  const commentChanged = (before.verdictComment ?? null) !== comment;
  if (verdictChanged || commentChanged) {
    const parts: string[] = [];
    if (verdictChanged) parts.push(`${verdictWord(before.verdict)} → ${verdictWord(verdict)}`);
    if (commentChanged) parts.push('rationale edited');
    await logActivity({ actor: user, action: 'VERDICT_CHANGED', org: before, detail: parts.join(', ') });
  }
  refreshOrg(orgId);
  return { ok: true };
}

/** Admin feeds the Ecociate score (already out of 60) and its reasoning. Blank clears it. */
export async function saveEcociateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole('ADMIN');
  const orgId = String(formData.get('orgId') ?? '');
  const raw = String(formData.get('score') ?? '').trim();
  let ecociateScore: number | null = null;
  if (raw !== '') {
    ecociateScore = Number(raw);
    if (!Number.isFinite(ecociateScore) || ecociateScore < 0 || ecociateScore > ECOCIATE_MAX) {
      return { error: `score must be from 0 to ${ECOCIATE_MAX}` };
    }
  }
  const ecociateRemarks = String(formData.get('remarks') ?? '').trim() || null;

  const before = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true, name: true, ecociateScore: true, ecociateRemarks: true } });
  if (!before) return { error: 'organisation not found' };

  await prisma.org.update({ where: { id: orgId }, data: { ecociateScore, ecociateRemarks } });

  const scoreChanged = before.ecociateScore !== ecociateScore;
  const remarksChanged = (before.ecociateRemarks ?? null) !== ecociateRemarks;
  if (scoreChanged || remarksChanged) {
    const show = (n: number | null) => (n === null ? 'not set' : String(n));
    const parts: string[] = [];
    if (scoreChanged) parts.push(`${show(before.ecociateScore)} → ${show(ecociateScore)} / ${ECOCIATE_MAX}`);
    if (remarksChanged) parts.push('reasoning edited');
    await logActivity({ actor: user, action: 'ECOCIATE_CHANGED', org: before, detail: parts.join(', ') });
  }
  refreshOrg(orgId);
  return { ok: true };
}
