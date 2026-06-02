# 06 — Authentication

We use Supabase Auth's Google OAuth provider. Sign in with Google → land back
in the app with a session → your data syncs.

## The two services involved

- [`src/services/supabase.ts`](../src/services/supabase.ts) — the singleton
  Supabase client, configured with `detectSessionInUrl: true` on web so
  OAuth tokens in the URL hash get processed automatically
- [`src/services/auth.ts`](../src/services/auth.ts) — wrappers around
  `signInWithOAuth`, sign-out, and a `useAuthUser()` React hook

## Web sign-in flow (PC + phone Chrome)

```
1. User clicks "Sign in with Google" (in AccountChip top-right, or in Settings)
2. auth.ts → supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
3. Supabase builds a Google OAuth URL with the right client_id + redirect_uri
4. Browser redirects to accounts.google.com
5. User picks account + grants access
6. Google redirects to https://fvgqgptarhdluhkkpcjg.supabase.co/auth/v1/callback?code=...
7. Supabase exchanges the code for a session, redirects back to
   our app at `redirectTo` with `#access_token=…&refresh_token=…&...`
8. Supabase JS client (on page load, because `detectSessionInUrl: true`)
   reads the hash, creates a session, persists to localStorage,
   fires `onAuthStateChange('SIGNED_IN', session)`
9. Sync layer's auth listener (attached at app start) calls `startSync(userId)`
10. AccountChip's `useAuthUser()` hook re-renders, swaps Sign-in button → name
```

## Native sign-in flow (iOS/Android dev build)

```
1. User clicks "Sign in with Google"
2. auth.ts → makeRedirectUri() generates a deep-link callback URL for our app
3. signInWithOAuth({ skipBrowserRedirect: true }) returns the OAuth URL
4. expo-auth-session's WebBrowser.openAuthSessionAsync() opens the system browser
5. User authenticates with Google
6. Google → Supabase → our deep link comes back through the OS to our app
7. We extract `?code=...` from the URL and call `supabase.auth.exchangeCodeForSession(code)`
8. Session created, persisted to AsyncStorage, onAuthStateChange fires
```

The PWA-installed version on a phone runs as if it were a website (web flow),
not the native flow — Chrome's PWA wrapper doesn't expose deep-link routing.
That's fine; the web flow works in PWA standalone mode.

## What gets stored where after sign-in

| Where | What | Lifetime |
|---|---|---|
| `localStorage['sb-fvgqgpta…-auth-token']` | JWT access + refresh token | Until sign-out or expiry |
| `localStorage['roadmap.store.v2']` | Zustand state cache | Until sign-out (wiped by `resetAll`) |
| Supabase Postgres | Your goals/notes/etc. | Forever (until you delete the account) |

## `useAuthUser()` hook

A tiny React hook that re-renders on auth state changes:

```ts
const { user, loading } = useAuthUser();
// user: { id, email, name } | null
// loading: true on first render until getUser() resolves
```

It listens to `supabase.auth.onAuthStateChange` and updates state on
SIGN_IN, SIGN_OUT, USER_UPDATED, TOKEN_REFRESHED events.

## Sign-out

`signOut()` calls `supabase.auth.signOut()` which:
1. Revokes the refresh token at Supabase
2. Clears the local auth token from storage
3. Fires `onAuthStateChange('SIGNED_OUT', null)`
4. Our sync layer's listener catches that → calls `stopSync()`
5. `stopSync()` stops realtime + the state watcher, then calls
   `useStore.getState().resetAll()` to wipe local data back to initial

After sign-out the app shows whatever a fresh visitor sees (the seed).

## Account chip

[`src/components/AccountChip.tsx`](../src/components/AccountChip.tsx) — the
top-right chip on every screen. Two states:

- **Signed out** → "Sign in with Google" button → clicking calls `signInWithGoogle()`
- **Signed in** → user's name + chevron → opens a small menu with "Sign out"

If Supabase env vars aren't configured (`supabaseConfigured() === false`)
the chip is hidden entirely — keeps the local-first experience clean.

## Required Supabase + Google configuration

For sign-in to actually work, three places need to know about each URL the
app runs at:

### Supabase Dashboard → Authentication → URL Configuration

- **Site URL**: your deployed Cloudflare URL, e.g. `https://roadmap-app.vilhelmas-zu.workers.dev`
- **Redirect URLs** (allow list):
  - `https://roadmap-app.vilhelmas-zu.workers.dev/**`
  - `http://localhost:8081/**` (for local dev)

### Supabase Dashboard → Authentication → Providers → Google

- **Enable Sign in with Google**: ON
- **Client IDs**: paste from Google Cloud Console (long string ending `.apps.googleusercontent.com`)
- **Client Secret**: paste from Google Cloud Console

### Google Cloud Console → APIs & Services → Credentials → your OAuth client

- **Authorized JavaScript origins**:
  - `https://roadmap-app.vilhelmas-zu.workers.dev`
  - `http://localhost:8081`
- **Authorized redirect URIs**:
  - `https://fvgqgptarhdluhkkpcjg.supabase.co/auth/v1/callback` (Supabase's callback)

If any of those is missing for the URL you're signing in from, the flow
fails (usually silently — the popup just closes and nothing happens).
