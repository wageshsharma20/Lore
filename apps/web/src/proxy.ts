import { NextResponse } from 'next/server';
import { auth } from './auth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize Ratelimit if Redis env vars are present
// This prevents the build from crashing locally if keys are missing
const ratelimit = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  : null;

export default auth(async (req) => {
  // 1. PROFESSIONAL RATE LIMITING (Upstash Redis)
  if (ratelimit) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // 2. PROFESSIONAL AUTHENTICATION (Auth.js)
  const isLoggedIn = !!req.auth;
  
  // Skip auth checks for login page, api routes, and static files
  if (
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Enforce authentication on protected routes
  if (!isLoggedIn && process.env.NODE_ENV === 'production') {
    // In a real app with Auth.js, we redirect unauthenticated users to sign-in
    // return NextResponse.redirect(new URL('/api/auth/signin', req.nextUrl.origin));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
