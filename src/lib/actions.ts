'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { requireRole } from './auth/session';
import { PARAMETERS, type ScoreEntry } from './rubric';
import { ECOCIATE_MAX } from './constants';

export interface FormState {
  error?: string;
  ok?: boolean;
}

/** Juror saves (or re-saves) their own review. The juror id always comes from the session, never
 *  from the form, so nobody can write a score as someone else. */
export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole('JURY');
  const orgId = String(formData.get('orgId') ?? '');
  const org = await prisma.org.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) return { error: 'organisation not found' };

  const entries: ScoreEntry[] = [];
  for (const p of PARAMETERS) {
    const raw = String(formData.get(`score_${p.key}`) ?? '').trim();
    const score = Number(raw);
    if (raw === '' || !Number.isFinite(score) || score < 0 || score > p.max) {
      return { error: `${p.label}: enter a score from 0 to ${p.max}` };
    }
    entries.push({ key: p.key, score, remarks: String(formData.get(`remarks_${p.key}`) ?? '').trim() });
  }
  const total = entries.reduce((s, e) => s + e.score, 0);

  await prisma.juryScore.upsert({
    where: { orgId_jurorId: { orgId, jurorId: user.id } },
    create: { orgId, jurorId: user.id, entries: JSON.stringify(entries), total },
    update: { entries: JSON.stringify(entries), total },
  });
  revalidatePath('/jury');
  revalidatePath(`/jury/${orgId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/${orgId}`);
  return { ok: true };
}

/** Admin records the final Y/N call and rationale; the snapshot reads it straight from the org. */
export async function setVerdictAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole('ADMIN');
  const orgId = String(formData.get('orgId') ?? '');
  const v = String(formData.get('verdict') ?? '');
  const verdict = v === 'Y' || v === 'N' ? v : null;
  const comment = String(formData.get('comment') ?? '').trim() || null;
  await prisma.org.update({ where: { id: orgId }, data: { verdict, verdictComment: comment, verdictAt: verdict ? new Date() : null } });
  revalidatePath('/admin');
  revalidatePath(`/admin/${orgId}`);
  return { ok: true };
}

/** Admin feeds the Ecociate score (already out of 60) and its reasoning. Blank clears it. */
export async function saveEcociateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole('ADMIN');
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
  await prisma.org.update({ where: { id: orgId }, data: { ecociateScore, ecociateRemarks } });
  revalidatePath('/admin');
  revalidatePath(`/admin/${orgId}`);
  revalidatePath('/jury');
  revalidatePath(`/jury/${orgId}`);
  return { ok: true };
}

/** Juror withdraws their own review of one organisation (back to "not scored"). */
export async function clearReviewAction(orgId: string): Promise<FormState> {
  const user = await requireRole('JURY');
  await prisma.juryScore.deleteMany({ where: { orgId, jurorId: user.id } });
  revalidatePath('/jury');
  revalidatePath(`/jury/${orgId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/${orgId}`);
  return { ok: true };
}
