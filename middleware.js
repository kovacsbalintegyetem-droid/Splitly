import { NextResponse } from 'next/server';

// Ez a funkció minden, a "matcher"-ben megadott útvonalra lefut
export function middleware(req) {
  const basicAuthUser = process.env.ADMIN_USER;
  const basicAuthPass = process.env.ADMIN_PASSWORD;

  if (!basicAuthUser || !basicAuthPass) {
    return new NextResponse('Authentication credentials are not set.', {
      status: 500,
    });
  }

  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const auth = authHeader.split(' ')[1];
    
    // ⬇️ ITT VAN A JAVÍTÁS ⬇️
    // "atob(auth)" helyett a megbízhatóbb Buffer-t használjuk a visszafejtéshez.
    const [user, pass] = Buffer.from(auth, 'base64').toString().split(':');

    if (user === basicAuthUser && pass === basicAuthPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// A konfiguráció megadja, hogy a middleware mely útvonalakra érvényes
export const config = {
  matcher: '/admin/:path*', // Minden /admin/ kezdetű útvonalra
};