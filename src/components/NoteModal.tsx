import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { useActiveProject } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { decrypt, encrypt, isVaultUnlocked, onVaultLockChange } from '@/services/vault';
import { ConfirmModal } from './ConfirmModal';
import { VaultUnlockModal } from './VaultUnlockModal';
import { AppText } from './ui';

// Shared note editor — used by both /notes and the Roadmap Notes pad.
// Title + body autosave to the store. Delete asks for confirmation.
// Renders as a roomy near-full-screen notepad so long notes are readable.
//
// When `note.secure === true`, the body in the store is an encrypted
// envelope. We decrypt on open, render the plaintext for editing, and
// re-encrypt the plaintext before writing back to the store.
//
// If the vault is locked, we show a lock screen with an "Unlock" button.
export function NoteModal({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const { theme } = useTheme();
  const note = useStore((s) => s.notes.find((n) => n.id === noteId));
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const setNoteScope = useStore((s) => s.setNoteScope);
  const activeProject = useActiveProject();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEncrypt, setConfirmEncrypt] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState<'setup' | 'unlock' | null>(null);
  const [unlockTick, setUnlockTick] = useState(0); // forces re-render on unlock/lock
  const [plain, setPlain] = useState<string>(''); // decrypted plaintext for editing
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const isGlobal = note ? !note.projectId : false;
  const secure = !!note?.secure;
  const unlocked = isVaultUnlocked();

  // Re-render when the vault gets locked/unlocked elsewhere.
  useEffect(() => onVaultLockChange(() => setUnlockTick((x) => x + 1)), []);

  // Decrypt body when opening a secure note. Re-run if vault state flips.
  // Track which note we've decrypted to avoid races between rapid opens.
  const decryptedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!note) {
      decryptedFor.current = null;
      setPlain('');
      setDecryptError(null);
      return;
    }
    if (!secure) {
      decryptedFor.current = note.id;
      setPlain(note.body);
      setDecryptError(null);
      return;
    }
    if (!unlocked) {
      decryptedFor.current = null;
      setPlain('');
      setDecryptError(null);
      return;
    }
    // Secure note + unlocked vault → decrypt.
    let cancelled = false;
    decryptedFor.current = null;
    decrypt(note.body)
      .then((plaintext) => {
        if (cancelled) return;
        decryptedFor.current = note.id;
        setPlain(plaintext);
        setDecryptError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setDecryptError('Could not decrypt this note — wrong passphrase?');
      });
    return () => {
      cancelled = true;
    };
  }, [note?.id, secure, unlocked, unlockTick, note?.body]);

  // Persist plaintext edits — encrypt first if the note is secure.
  const onBodyChange = (next: string) => {
    setPlain(next);
    if (!note) return;
    if (!secure) {
      updateNote(note.id, { body: next });
      return;
    }
    // Encrypt then write. Awaited but we don't block the keystroke render.
    encrypt(next)
      .then((envelope) => updateNote(note.id, { body: envelope }))
      .catch((e) => console.error('[vault] encrypt failed', e));
  };

  // First-time encryption flow: confirm, set up passphrase if needed, then
  // encrypt the current body and flip the `secure` flag.
  const askToEncrypt = () => setConfirmEncrypt(true);
  const doEncrypt = async () => {
    if (!note) return;
    setConfirmEncrypt(false);
    if (!isVaultUnlocked()) {
      setUnlockOpen('setup');
      return;
    }
    const envelope = await encrypt(note.body);
    updateNote(note.id, { body: envelope, secure: true });
  };
  // After unlock/setup completes, finish the encrypt flow if that's what we were doing.
  const onUnlocked = async () => {
    const wasSetup = unlockOpen === 'setup';
    setUnlockOpen(null);
    if (note && wasSetup && !secure) {
      const envelope = await encrypt(note.body);
      updateNote(note.id, { body: envelope, secure: true });
    }
  };

  // Decrypt + replace body with plaintext + flip secure off.
  const decryptAndUnlock = async () => {
    if (!note || !secure || !isVaultUnlocked()) return;
    try {
      const plaintext = await decrypt(note.body);
      updateNote(note.id, { body: plaintext, secure: false });
    } catch (e) {
      console.error('[vault] decrypt failed', e);
    }
  };

  return (
    <Modal transparent visible={!!noteId} animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: Space.lg,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            height: '95%',
            maxHeight: '95%',
            width: '100%',
            maxWidth: 900,
            alignSelf: 'center',
          }}>
          {/* Always-visible close button — anchored to the corner so the
              cramped header row on narrow phones can't push it off-screen. */}
          {note ? (
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close note"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 2,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          ) : null}
          {note ? (
            <ScrollView
              contentContainerStyle={{ padding: Space.xl, gap: Space.md }}
              keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={secure ? 'lock-closed' : 'document-text'}
                  size={18}
                  color={secure ? theme.colors.warning : theme.colors.primary}
                />
                <TextInput
                  value={note.title}
                  onChangeText={(t) => updateNote(note.id, { title: t })}
                  placeholder="Note title"
                  placeholderTextColor={theme.colors.textFaint}
                  style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '700' }}
                />
                {/* Encrypt / decrypt toggle */}
                <Pressable
                  onPress={secure ? decryptAndUnlock : askToEncrypt}
                  hitSlop={10}
                  accessibilityLabel={secure ? 'Decrypt (remove encryption)' : 'Encrypt this note'}>
                  <Ionicons
                    name={secure ? 'lock-open-outline' : 'lock-closed-outline'}
                    size={20}
                    color={secure ? theme.colors.success : theme.colors.textMuted}
                  />
                </Pressable>
                <Pressable onPress={() => setConfirmDelete(true)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </Pressable>
                {/* Spacer where the inline X used to sit — the anchored
                    close button above replaces it, leaving room here so the
                    title input can't slide under the corner button. */}
                <View style={{ width: 36 }} />
              </View>

              {/* Scope toggle: keep with active project OR move to global library */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <Pressable
                  onPress={() => setNoteScope(note.id, 'project')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: Radius.pill,
                    paddingHorizontal: Space.md,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: !isGlobal ? activeProject.color : theme.colors.border,
                    backgroundColor: !isGlobal ? activeProject.color : 'transparent',
                  }}>
                  <Ionicons
                    name={activeProject.icon as any}
                    size={12}
                    color={!isGlobal ? '#fff' : theme.colors.textMuted}
                  />
                  <AppText size={11} weight="700" color={!isGlobal ? 'primaryText' : 'textMuted'}>
                    {activeProject.name.toUpperCase()}
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setNoteScope(note.id, 'global')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: Radius.pill,
                    paddingHorizontal: Space.md,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: isGlobal ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isGlobal ? theme.colors.primary : 'transparent',
                  }}>
                  <Ionicons
                    name="globe-outline"
                    size={12}
                    color={isGlobal ? theme.colors.primaryText : theme.colors.textMuted}
                  />
                  <AppText size={11} weight="700" color={isGlobal ? 'primaryText' : 'textMuted'}>
                    GLOBAL
                  </AppText>
                </Pressable>
                {secure ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      borderRadius: Radius.pill,
                      paddingHorizontal: Space.md,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: theme.colors.warning,
                      backgroundColor: theme.colors.warning + '22',
                    }}>
                    <Ionicons name="shield-checkmark" size={12} color={theme.colors.warning} />
                    <AppText size={11} weight="800" style={{ color: theme.colors.warning }}>
                      ENCRYPTED
                    </AppText>
                  </View>
                ) : null}
              </View>

              {/* Body — either the locked screen, an error, or the editable plaintext */}
              {secure && !unlocked ? (
                <View
                  style={{
                    alignItems: 'center',
                    gap: Space.md,
                    padding: Space.xl,
                    minHeight: 400,
                    borderRadius: Radius.md,
                    backgroundColor: theme.colors.surfaceAlt,
                  }}>
                  <Ionicons name="lock-closed" size={48} color={theme.colors.textMuted} />
                  <AppText weight="800" size={15}>
                    Locked
                  </AppText>
                  <AppText color="textMuted" size={13} weight="500" style={{ textAlign: 'center', maxWidth: 320 }}>
                    Enter your vault passphrase to read this note.
                  </AppText>
                  <Pressable
                    onPress={() => setUnlockOpen('unlock')}
                    style={{
                      paddingHorizontal: Space.lg,
                      paddingVertical: Space.sm,
                      borderRadius: Radius.pill,
                      backgroundColor: theme.colors.primary,
                    }}>
                    <AppText weight="800" size={13} color="primaryText">
                      Unlock
                    </AppText>
                  </Pressable>
                </View>
              ) : decryptError ? (
                <View
                  style={{
                    padding: Space.lg,
                    borderRadius: Radius.md,
                    backgroundColor: theme.colors.danger + '22',
                    borderWidth: 1,
                    borderColor: theme.colors.danger,
                  }}>
                  <AppText weight="700" style={{ color: theme.colors.danger }}>
                    {decryptError}
                  </AppText>
                </View>
              ) : (
                <TextInput
                  value={plain}
                  onChangeText={onBodyChange}
                  placeholder={secure ? 'Encrypted note — write secrets here…' : 'Write your thoughts here…'}
                  placeholderTextColor={theme.colors.textFaint}
                  multiline
                  style={{
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: Radius.md,
                    padding: Space.md,
                    minHeight: 600,
                    textAlignVertical: 'top',
                    fontSize: 16,
                    fontWeight: '500',
                    lineHeight: 26,
                  }}
                />
              )}
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
      {note ? (
        <ConfirmModal
          visible={confirmDelete}
          title="Delete this note?"
          body={`"${note.title || 'Untitled note'}" will be permanently removed.`}
          confirmLabel="Delete"
          danger
          icon="trash"
          onConfirm={() => {
            deleteNote(note.id);
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      ) : null}
      {note ? (
        <ConfirmModal
          visible={confirmEncrypt}
          title="Encrypt this note?"
          body="The body becomes unreadable without your vault passphrase. If you forget the passphrase, the note is permanently lost — there is no reset."
          confirmLabel="Encrypt"
          icon="lock-closed"
          onConfirm={doEncrypt}
          onClose={() => setConfirmEncrypt(false)}
        />
      ) : null}
      <VaultUnlockModal
        visible={unlockOpen !== null}
        mode={unlockOpen ?? 'unlock'}
        onCancel={() => setUnlockOpen(null)}
        onUnlocked={onUnlocked}
      />
    </Modal>
  );
}
