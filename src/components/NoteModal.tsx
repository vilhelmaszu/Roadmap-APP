import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { useActiveProject } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { ConfirmModal } from './ConfirmModal';
import { AppText } from './ui';

// Shared note editor — used by both /notes and the Roadmap Notes pad.
// Title + body autosave to the store. Delete asks for confirmation.
// Renders as a roomy near-full-screen notepad so long notes are readable.
export function NoteModal({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const { theme } = useTheme();
  const note = useStore((s) => s.notes.find((n) => n.id === noteId));
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const setNoteScope = useStore((s) => s.setNoteScope);
  const activeProject = useActiveProject();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isGlobal = note ? !note.projectId : false;

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
          {note ? (
            <ScrollView
              contentContainerStyle={{ padding: Space.xl, gap: Space.md }}
              keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={18} color={theme.colors.primary} />
                <TextInput
                  value={note.title}
                  onChangeText={(t) => updateNote(note.id, { title: t })}
                  placeholder="Note title"
                  placeholderTextColor={theme.colors.textFaint}
                  style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '700' }}
                />
                <Pressable onPress={() => setConfirmDelete(true)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </Pressable>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </Pressable>
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
              </View>
              <TextInput
                value={note.body}
                onChangeText={(t) => updateNote(note.id, { body: t })}
                placeholder="Write your thoughts here…"
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
    </Modal>
  );
}
