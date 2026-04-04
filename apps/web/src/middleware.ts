import { NextResponse } from 'next/server';

// Auth protection is handled client-side by useAuth hook.
// In cross-domain deployments (Vercel + Render), the API cookie
// is not visible to Next.js middleware, so we can't check it here.
// The useAuth hook calls /auth/me with credentials: include,
// which sends the cookie to the API domain correctly.

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
