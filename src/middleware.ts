import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/token';
import { SESSION_COOKIE } from '@/lib/constants';

// Everything except /login requires a valid signed, unexpired session. /admin is ADMIN-only and
// /jury is JURY-only; pages re-check against the database as well.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/login') return NextResponse.next();

  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/admin') && s.role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.url));
  if (pathname.startsWith('/jury') && s.role !== 'JURY') return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
