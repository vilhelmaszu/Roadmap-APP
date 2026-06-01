// Auth wrapper around Supabase. Google OAuth via expo-auth-session.
//
// On web, Supabase's `signInWithOAuth` handles the popup + redirect itself.
// On native, we use expo-auth-session to open the system browser, capture the
// callback, and hand the code back to Supabase.

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// Required for native to close the in-app browser after redirect.
WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

// Hook: returns the current signed-in user, or null. Re-renders on auth change.
export function useAuthUser(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    sb.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(toUser(data.user));
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user ?? null));
      setLoading(false);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

function toUser(u: { id: string; email?: string | null; user_metadata?: any } | null): AuthUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    name: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? null) as string | null,
  };
}

// Trigger Google OAuth. Resolves once the user has signed in (or rejects on cancel/error).
export async function signInWithGoogle(): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error('Supabase not configured');

  if (Platform.OS === 'web') {
    // Supabase handles the redirect URL on web — back to the current origin.
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return;
  }

  // Native: drive the browser ourselves, then exchange the returned code.
  const redirectTo = AuthSession.makeRedirectUri();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error(result.type === 'cancel' ? 'Cancelled' : 'Sign-in failed');
  }

  // Pull the auth code out of the callback URL and exchange it for a session.
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('No code in OAuth callback');
  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export async function signOut(): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  await sb.auth.signOut();
}
