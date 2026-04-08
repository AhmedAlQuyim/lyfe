import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/auth/callback'];

export async function proxy(request: NextRequest) {
  // If Supabase is not configured, allow all requests (local dev without auth)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll:  ()             => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path    = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

  // Unauthenticated user hitting a protected route → /login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Authenticated user hitting /, /login or /signup → /dashboard
  if (user && (path === '/' || path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|manifest\\.json$|favicon\\.ico$).*)',
  ],
};
