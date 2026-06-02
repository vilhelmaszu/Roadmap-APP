# 05 — Secure Vault

Encrypted notes for things you don't want sitting in plaintext in cloud
storage — API keys, passwords, recovery codes, anything sensitive.

## How it works

Each note has a `secure?: boolean` flag. When true:

- `note.body` holds an **encrypted envelope** (JSON-encoded ciphertext +
  IV + salt) instead of plaintext
- The notes list shows a 🔒 icon and "Encrypted — tap to unlock and read"
  instead of a body preview
- Opening the note shows a locked screen until you enter the vault passphrase
- After unlock, the body decrypts client-side and you can read + edit normally
- On save, the new body is re-encrypted before being stored

## The encryption

Standard symmetric encryption using browser-native Web Crypto:

- **Key derivation**: PBKDF2-HMAC-SHA256, 200,000 iterations, 256-bit output
  → derives the AES key from your passphrase + a per-note random 16-byte salt
- **Encryption**: AES-GCM with a 12-byte random IV
- **Envelope format** stored in `note.body`:

```json
{
  "v": 1,
  "salt": "base64",
  "iv": "base64",
  "ct": "base64"
}
```

200k PBKDF2 iterations means a brute-force attack against a strong passphrase
costs roughly ~100ms per guess on a fast laptop — slow enough that even a
billion guesses takes years.

## The passphrase

**One passphrase covers all your encrypted notes.** It only ever exists in
memory of the current browser tab. The vault module
([`src/services/vault.ts`](../src/services/vault.ts)) holds a
`let passphrase: string | null = null;` and updates it via `unlockVault(pass)`
/ `lockVault()`. Never persisted to disk, never sent to Supabase.

When you reload the tab → passphrase is gone → you re-enter it the next time
you open an encrypted note (or via Settings → Vault → Unlock).

When you sign out → store wipes → if any unencrypted notes were in memory
they're cleared too. Encrypted ciphertext stayed in Supabase the whole time
and remains unreadable to anyone without your passphrase.

### What if I forget the passphrase?

**The notes are permanently unreadable.** There is no reset, no recovery, no
email link. This is by design — if there were a recovery mechanism it would
also be an attack surface.

When you first encrypt a note we show a big yellow warning explaining this.
Take that seriously. Write the passphrase down somewhere safe (a password
manager, a paper backup) before you trust the vault with anything important.

## What's encrypted, what's not

| Field | Encrypted? |
|---|---|
| `note.body` | Yes, when `note.secure === true` |
| `note.title` | No — kept readable so you can find the note while locked |
| `note.projectId`, `createdAt`, `updatedAt`, `secure` | No |

So someone with Supabase access (or a screenshot of the cloud table) can see
that you have a note titled "Anthropic API key" but cannot read the actual
key value.

If you want the title hidden too, name your notes generically ("auth keys",
"prod creds", etc).

## Encrypting an existing note

In the note modal:

1. Click the 🔒 (lock-closed-outline) icon at the top, next to the trash icon
2. Confirm the warning ("encryption is irreversible without the passphrase")
3. If the vault is locked, you'll be asked to **set up** a passphrase first
   (with confirmation — two text inputs that must match)
4. The note body becomes an encrypted envelope; the icon flips to a closed
   lock; an ENCRYPTED chip appears in the scope row
5. Future opens require unlock

## Decrypting

Same icon — when a note is already encrypted, the icon shows as
🔓 (lock-open-outline). Click it:

1. The vault must be unlocked
2. The body is decrypted in place and `secure: false` is set
3. The note returns to plaintext storage

## Unlocking from Settings

Settings → Vault card → **Unlock** button. Shows a passphrase prompt. After
unlock, every encrypted note in the same browser tab can be read without
re-prompting.

The card also shows:
- Current state: **LOCKED** or **UNLOCKED**
- Count of encrypted notes in your library
- **Lock vault** button (when unlocked) to manually clear the passphrase

## Does it sync?

Yes — the `secure` flag is a column in the Supabase `notes` table and the
encrypted envelope syncs as `body` like any other string. On a second device
you'd need to enter the **same passphrase** on that device's first unlock.

The cloud only ever sees the envelope. Even with the database admin password,
Supabase staff can't read your encrypted notes.

## Why per-note salts and not a global salt

Each encryption call generates a fresh 16-byte salt. Two costs:

1. Each note has slightly more data (16 bytes overhead)
2. PBKDF2 key derivation runs once per encrypt/decrypt instead of being
   cached forever

Tradeoff: this means salts are device-portable (no separate salt-sync
needed) AND if any single encrypted note's salt+ciphertext leaks, that leak
doesn't help an attacker crack any OTHER note.

The cost is ~100ms extra per open. Not noticeable.

## Where the code lives

- [`src/services/vault.ts`](../src/services/vault.ts) — `unlockVault`, `lockVault`,
  `isVaultUnlocked`, `encrypt`, `decrypt`, `onVaultLockChange`
- [`src/components/VaultUnlockModal.tsx`](../src/components/VaultUnlockModal.tsx) —
  passphrase prompt UI (setup mode + unlock mode)
- [`src/components/NoteModal.tsx`](../src/components/NoteModal.tsx) — opens
  notes, handles encrypt/decrypt round-trips during render and save
- [`src/app/settings.tsx`](../src/app/settings.tsx) → `VaultCard` — manual
  unlock / lock entry point + status
- [`src/app/notes.tsx`](../src/app/notes.tsx) + [`src/app/roadmap.tsx`](../src/app/roadmap.tsx) —
  show 🔒 badge and hide encrypted body in previews

## Threat model

What the vault PROTECTS against:

- Anyone reading the Supabase cloud row (dashboard, leaked dump, malicious admin)
- Anyone reading the local AsyncStorage / localStorage cache (devtools snoop,
  abandoned signed-out session)
- A future me who shouldn't see the secrets

What the vault DOES NOT protect against:

- An attacker who can keylog or screen-record your active session while the
  vault is unlocked
- A malicious browser extension running in the same origin as the app
- You sharing the passphrase

Use the vault for things that should be unreadable at rest, not for things
that need to be invisible to an attacker actively watching your screen.
