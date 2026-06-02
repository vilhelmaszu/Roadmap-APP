// Secure vault — per-note client-side encryption for sensitive notes
// (API keys, passwords, etc.) using the browser/native Web Crypto API.
//
// Threat model
//   - Protect a stored note from anyone reading the cloud row (Supabase
//     dashboard, an attacker with the anon key + a signed-in session,
//     or my own future curiosity in the dashboard).
//   - Protect a stored note from local devtools snooping after sign-out
//     (the resetAll wipe clears state anyway, but plaintext shouldn't
//     hang around in localStorage either).
//
// What it is NOT
//   - It does not protect plaintext that's currently rendered on-screen.
//   - It does not let you recover lost notes — if you forget the passphrase,
//     the data is gone forever. (No key escrow, no recovery email.)
//
// Algorithm
//   - PBKDF2-HMAC-SHA256 with 200k iterations to derive a 256-bit AES key
//     from the user's passphrase + a per-note random 16-byte salt.
//   - AES-GCM with a 12-byte random IV for encryption.
//
// Envelope shape stored in note.body when note.secure === true:
//   JSON.stringify({ v: 1, salt: base64, iv: base64, ct: base64 })
//
// The passphrase lives ONLY in memory (this module's `passphrase` variable).
// It's cleared on `lockVault()` and on browser tab reload.

const PBKDF2_ITERATIONS = 200_000;

// Module-private state.
let passphrase: string | null = null;
let listeners: Array<() => void> = [];
function emit() {
  for (const fn of listeners) fn();
}

// --- Public API ------------------------------------------------------------

export function isVaultUnlocked(): boolean {
  return passphrase !== null;
}

export function unlockVault(pass: string): void {
  passphrase = pass;
  emit();
}

export function lockVault(): void {
  passphrase = null;
  emit();
}

export function onVaultLockChange(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((f) => f !== cb);
  };
}

// Encrypt plain text → encrypted envelope string. Throws if vault is locked.
export async function encrypt(plaintext: string): Promise<string> {
  if (passphrase === null) throw new Error('Vault is locked');
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  // BufferSource cast: WebCrypto's TS types require an ArrayBuffer-backed view;
  // our Uint8Array always is, but TS's union with SharedArrayBuffer trips it.
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource,
  );
  return JSON.stringify({
    v: 1,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(cipherBuf)),
  });
}

// Decrypt an envelope string → plain text. Throws on wrong passphrase or
// malformed envelope. Vault must be unlocked first.
export async function decrypt(envelope: string): Promise<string> {
  if (passphrase === null) throw new Error('Vault is locked');
  const parsed = JSON.parse(envelope) as { v: number; salt: string; iv: string; ct: string };
  if (parsed.v !== 1) throw new Error('Unsupported envelope version');
  const salt = b64ToBytes(parsed.salt);
  const iv = b64ToBytes(parsed.iv);
  const ct = b64ToBytes(parsed.ct);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  return new TextDecoder().decode(plainBuf);
}

// Quick check that a string is a vault envelope (not arbitrary user text).
// Used to distinguish "encrypted body in store but vault disabled" from
// "plain text body".
export function isEnvelope(s: string): boolean {
  if (!s || s[0] !== '{') return false;
  try {
    const o = JSON.parse(s);
    return typeof o === 'object' && o !== null && o.v === 1 && typeof o.salt === 'string' && typeof o.iv === 'string' && typeof o.ct === 'string';
  } catch {
    return false;
  }
}

// --- Internals -------------------------------------------------------------

async function deriveKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function bytesToB64(bytes: Uint8Array): string {
  // btoa works on a binary string; build it without spreading the array
  // because >100k entries would blow the call stack.
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
