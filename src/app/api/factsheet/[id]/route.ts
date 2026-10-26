import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Serves an organisation's evaluation fact sheet PDF to anyone signed in (admin or jury). The middleware
 *  already turns signed-out visitors away; this checks the account again against the database. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response('sign in first', { status: 401 });

  const sheet = await prisma.orgFactsheet.findUnique({ where: { orgId: params.id }, select: { pdf: true, org: { select: { name: true } } } });
  if (!sheet) return new Response('no factsheet for this organisation', { status: 404 });

  const filename = `${sheet.org.name} - evaluation fact sheet.pdf`;
  return new Response(new Uint8Array(sheet.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
