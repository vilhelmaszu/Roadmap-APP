// Supabase client singleton.
//
// Reads URL + anon key from EXPO_PUBLIC_* env vars so they bundle into the
// client (these are public-by-design — security lives in Row-Level Security
// policies on the database, not in hiding the anon key).
//
// `lazy()` returns `null` until the env vars are present, so the rest of the
// app can render before Supabase is configured. Anything that needs Supabase
// should branch on the null return.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  if (!_client) {
    _client = createClient(URL, ANON, {
      auth: {
        // Persist the session in AsyncStorage so the user stays signed in
        // across reloads on both web (localStorage-backed) and mobile.
        storage: AsyncStorage as never,
        autoRefreshToken: true,
        persistSession: true,
        // On web, OAuth comes back as `?code=...` in the URL → Supabase needs
        // to read and exchange it for a session itself. On native, expo-auth-session
        // handles the redirect and calls exchangeCodeForSession manually.
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return _client;
}

// True when Supabase env is configured. UI can use this to hide cloud features.
export function supabaseConfigured(): boolean {
  return !!URL && !!ANON;
}
