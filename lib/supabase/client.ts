import { createBrowserClient } from '@supabase/ssr';

/**
 * A single shared browser client for the whole app.
 *
 * Previously this created a NEW client on every call. Each instance spins up
 * its own GoTrueClient, and they all contend for the same Navigator lock
 * ("lock:sb-<ref>-auth-token"). Under concurrent writes the lock timed out at
 * 5s, got "stolen", and pending getUser()/getSession() calls rejected with
 * `AbortError: Lock broken by another request` — so those writes silently
 * failed (e.g. whole workout programs vanishing after a reload).
 *
 * Memoizing to one instance means one lock owner and no cross-instance
 * contention.
 */
function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof makeClient> | undefined;

export function createClient() {
  return (browserClient ??= makeClient());
}
