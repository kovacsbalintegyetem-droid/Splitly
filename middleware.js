// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Ha a felhasználó nincs bejelentkezve, és nem a login oldalt próbálja elérni,
  // akkor irányítsuk át a login oldalra.
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Ha a felhasználó be van jelentkezve, és a login oldalt próbálja elérni,
  // akkor irányítsuk át a főoldalra.
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Itt adjuk meg, mely útvonalakon fusson le a middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};