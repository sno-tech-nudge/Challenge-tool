import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { parseEntries } from '@/lib/rubric';
import { buildReviewPdf } from '@/lib/review-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** A juror's own submitted review as a PDF. The juror comes from the session, so nobody can download
 *  someone else's scores by changing the address. */
export async function GET(_req: Request, { params }: { params: { orgId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response('sign in first', { status: 401 });
  if (user.role !== 'JURY') return new Response('only jurors have scores to download', { status: 403 });

  const review = await prisma.juryScore.findUnique({
    where: { orgId_jurorId: { orgId: params.orgId, jurorId: user.id } },
    include: { org: { select: { name: true } } },
  });
  if (!review) return new Response('you have not submitted scores for this organisation yet', { status: 404 });

  const pdf = await buildReviewPdf({
    orgName: review.org.name,
    jurorName: user.name,
    submittedAt: review.updatedAt,
    rescoreCount: review.rescoreCount,
    entries: parseEntries(review.entries),
    total: review.total,
    verdict: review.verdict,
    comment: review.internalRemarks,
  });
  const filename = `${review.org.name} - my scores.pdf`;
  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
