import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { NoteModal } from '@/components/NoteModal';
import { NoteNameModal } from '@/components/NoteNameModal';
import { AppText, Card, Screen, SectionHeader, useWide } from '@/components/ui';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveProject } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

// Scope is either a project id, 'global', or 'all' (everything across all projects + global).
type Scope = string | 'all' | 'global';

export default function Notes() {
  const { theme } = useTheme();
  const wide = useWide();
  const { lang } = useI18n();
  const allNotes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const activeProject = useActiveProject();
  const addNote = useStore((s) => s.addNote);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('all');
  // Naming popup — created note is only persisted after a title is confirmed.
  const [naming, setNaming] = useState(false);

  // Project notes are stamped with a projectId; global notes have none.
  const visible = allNotes.filter((n) => {
    if (scope === 'all') return true;
    if (scope === 'global') return !n.projectId;
    return n.projectId === scope;
  });
  const sorted = [...visible].sort((a, b) => b.updatedAt - a.updatedAt);

  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const onNewNote = () => {
    // Open the name prompt first — actual creation happens in handleNameConfirmed.
    setNaming(true);
  };

  const handleNameConfirmed = (title: string) => {
    setNaming(false);
    let newId: string;
    if (scope === 'global') {
      newId = addNote('global', title);
    } else if (scope === 'all' || scope === activeProject.id) {
      newId = addNote('project', title);
    } else {
      // Switch active project first to create in another project's bucket.
      useStore.getState().setActiveProject(scope);
      newId = addNote('project', title);
    }
    setActiveNoteId(newId);
  };

  return (
    <Screen title="Notes" subtitle="A scratchpad for ideas that aren't goals yet.">
      {/* Scope filter — All, each project, Global. Wraps to multiple rows so every chip stays visible. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
        <ScopeChip
          label="All"
          count={allNotes.length}
          active={scope === 'all'}
          color={theme.colors.primary}
          onPress={() => setScope('all')}
        />
        {projects.map((p) => {
          const n = allNotes.filter((x) => x.projectId === p.id).length;
          return (
            <ScopeChip
              key={p.id}
              label={tSeed(p.name, lang)}
              icon={p.icon}
              count={n}
              active={scope === p.id}
              color={p.color}
              onPress={() => setScope(p.id)}
            />
          );
        })}
        <ScopeChip
          label="Global"
          icon="globe-outline"
          count={allNotes.filter((x) => !x.projectId).length}
          active={scope === 'global'}
          color={theme.colors.accent}
          onPress={() => setScope('global')}
        />
      </View>

      <SectionHeader
        title="Your notes"
        action={
          <Pressable
            onPress={onNewNote}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: theme.colors.primary,
              borderRadius: Radius.pill,
              paddingHorizontal: Space.md,
              paddingVertical: 6,
            }}>
            <Ionicons name="add" size={16} color={theme.colors.primaryText} />
            <AppText weight="700" color="primaryText" size={13}>
              {scope === 'global' ? 'New global note' : 'New note'}
            </AppText>
          </Pressable>
        }
      />

      {sorted.length === 0 ? (
        <Card>
          <View style={{ alignItems: 'center', gap: Space.sm, paddingVertical: Space.lg }}>
            <Ionicons name="document-text-outline" size={32} color={theme.colors.textFaint} />
            <AppText color="textMuted" size={14} weight="600">
              {scope === 'global'
                ? 'No global notes yet'
                : scope === 'all'
                  ? 'No notes anywhere yet'
                  : `No notes in ${projectsById.get(scope)?.name ?? 'this project'} yet`}
            </AppText>
            <AppText color="textFaint" size={13} weight="500" style={{ textAlign: 'center' }}>
              {scope === 'global'
                ? 'Global notes appear in every project. Tap “New global note” to add one.'
                : 'Tap the button above to jot down an idea.'}
            </AppText>
          </View>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md }}>
          {sorted.map((n) => {
            const owner = n.projectId ? projectsById.get(n.projectId) : null;
            const isGlobal = !n.projectId;
            return (
              <Pressable
                key={n.id}
                onPress={() => setActiveNoteId(n.id)}
                style={{
                  width: wide ? '31%' : '100%',
                  flexGrow: 1,
                  minWidth: 220,
                  backgroundColor: theme.colors.surface,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: Space.lg,
                  gap: 6,
                  minHeight: 120,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="document-text" size={16} color={theme.colors.primary} />
                  <AppText weight="700" size={15} numberOfLines={1} style={{ flex: 1 }}>
                    {tSeed(n.title, lang) || 'Untitled note'}
                  </AppText>
                  {/* Scope badge — shows which project (or GLOBAL) the note belongs to */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: Radius.pill,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}>
                    <Ionicons
                      name={(isGlobal ? 'globe-outline' : (owner?.icon ?? 'folder')) as any}
                      size={9}
                      color={isGlobal ? theme.colors.accent : owner?.color ?? theme.colors.textMuted}
                    />
                    <AppText
                      size={9}
                      weight="800"
                      style={{
                        color: isGlobal ? theme.colors.accent : owner?.color ?? theme.colors.textMuted,
                        letterSpacing: 0.3,
                      }}>
                      {isGlobal ? 'GLOBAL' : tSeed(owner?.name ?? 'PROJECT', lang).toUpperCase()}
                    </AppText>
                  </View>
                </View>
                <AppText color="textMuted" size={13} weight="500" numberOfLines={5}>
                  {tSeed(n.body, lang) || 'Empty — tap to write.'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      <NoteModal noteId={activeNoteId} onClose={() => setActiveNoteId(null)} />
      <NoteNameModal
        visible={naming}
        onCancel={() => setNaming(false)}
        onConfirm={handleNameConfirmed}
      />
    </Screen>
  );
}

function ScopeChip({
  label,
  icon,
  count,
  active,
  color,
  onPress,
}: {
  label: string;
  icon?: string;
  count: number;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: active ? color : theme.colors.border,
        backgroundColor: active ? color : 'transparent',
        paddingHorizontal: Space.md,
        paddingVertical: 6,
      }}>
      {icon ? (
        <Ionicons name={icon as any} size={13} color={active ? '#fff' : color} />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? '#fff' : color }} />
      )}
      <AppText size={12} weight="700" color={active ? 'primaryText' : 'text'}>
        {label}
      </AppText>
      <View
        style={{
          backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.colors.surfaceAlt,
          borderRadius: Radius.pill,
          paddingHorizontal: 6,
          paddingVertical: 1,
        }}>
        <AppText size={10} weight="800" color={active ? 'primaryText' : 'textMuted'}>
          {count}
        </AppText>
      </View>
    </Pressable>
  );
}
