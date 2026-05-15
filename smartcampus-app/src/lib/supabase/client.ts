import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 36000, // 1 year (persistent login)
        path: '/',
        sameSite: 'lax',
      }
    }
  );
}
