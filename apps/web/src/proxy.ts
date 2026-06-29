import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely simple in-memory rate limiting scaffold for the hackathon
const ipRateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export function middleware(request: NextRequest) {
  // 1. RATE LIMITING
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  
  const rateData = ipRateLimit.get(ip) || { count: 0, timestamp: now };
  
  if (now - rateData.timestamp > RATE_LIMIT_WINDOW) {
    rateData.count = 1;
    rateData.timestamp = now;
  } else {
    rateData.count++;
  }
  
  ipRateLimit.set(ip, rateData);
  
  if (rateData.count > MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // 2. AUTHENTICATION SCAFFOLD
  // Skip auth checks for login page, api routes, and static files
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for a dummy auth cookie to simulate an active session
  const authCookie = request.cookies.get('hackathon_session');
  
  // If no auth cookie, redirect to login (scaffold)
  if (!authCookie && process.env.NODE_ENV === 'production') {
    // In production, we would force login. For local dev, let it pass to not break the workflow if /login isn't built yet.
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. CORS is handled in next.config.ts for production domains
  
  return NextResponse.next();
}

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
