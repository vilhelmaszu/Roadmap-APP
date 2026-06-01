import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveProject } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

const COLORS = ['#6C8BFF', '#22D3EE', '#A855F7', '#F472B6', '#34D399', '#FBBF24', '#FB7185', '#F97316', '#84CC16'];
const ICONS = ['rocket', 'flag', 'briefcase', 'fitness', 'school', 'bulb', 'heart', 'cash', 'musical-notes', 'leaf', 'flame', 'planet'];

// Tappable card in the sidebar showing the active project + chevron. Opens a
// picker with all projects + "New project". Compact in narrow sidebar mode.
export function ProjectSwitcher({ compact }: { compact?: boolean }) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const active = useActiveProject();
  const projects = useStore((s) => s.projects);
  const setActiveProject = useStore((s) => s.setActiveProject);
  const addProject = useStore((s) => s.addProject);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 0 : Space.sm,
          justifyContent: compact ? 'center' : 'flex-start',
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: compact ? Space.sm : Space.md,
          marginBottom: Space.md,
        }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: active.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name={active.icon as any} size={15} color="#fff" />
        </View>
        {compact ? null : (
          <>
            <View style={{ flex: 1 }}>
              <AppText size={11} weight="700" color="textFaint">
                PROJECT
              </AppText>
              <AppText size={13} weight="800" numberOfLines={1}>
                {tSeed(active.name, lang)}
              </AppText>
            </View>
            <Ionicons name="swap-horizontal" size={16} color={theme.colors.textMuted} />
          </>
        )}
      </Pressable>

      {/* Picker popup */}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Space.xl }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: Radius.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: Space.xl,
              gap: Space.md,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="albums" size={18} color={theme.colors.primary} />
              <AppText size={18} weight="800" style={{ flex: 1 }}>
                Switch project
              </AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <AppText color="textMuted" size={13} weight="500">
              Each project keeps its own long-term vision, goals, and notes. Your XP and achievements stay shared.
            </AppText>
            <ScrollView style={{ maxHeight: 320 }}>
              {projects.map((p) => {
                const selected = p.id === active.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setActiveProject(p.id);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Space.md,
                      paddingHorizontal: Space.sm,
                      paddingVertical: Space.md,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: p.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name={p.icon as any} size={17} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="700">{tSeed(p.name, lang)}</AppText>
                      <AppText color="textMuted" size={12} weight="500" numberOfLines={1}>
                        {tSeed(p.vision.title, lang) || 'No long-term vision yet'}
                      </AppText>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: theme.colors.primary,
                borderRadius: Radius.pill,
                paddingVertical: Space.md,
                marginTop: Space.sm,
              }}>
              <Ionicons name="add" size={18} color={theme.colors.primaryText} />
              <AppText weight="800" color="primaryText" size={14}>
                New project
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CreateProjectPopup
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={({ name, color, icon, targetYear }) => {
          addProject({ name, color, icon, targetYear });
          setCreateOpen(false);
        }}
      />
    </>
  );
}

function CreateProjectPopup({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; color: string; icon: string; targetYear: number }) => void;
}) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [year, setYear] = useState(String(new Date().getFullYear() + 5));

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      color,
      icon,
      targetYear: parseInt(year, 10) || new Date().getFullYear() + 5,
    });
    setName('');
    setColor(COLORS[0]);
    setIcon(ICONS[0]);
    setYear(String(new Date().getFullYear() + 5));
  };

  const field = {
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Space.md,
    fontSize: 15,
    fontWeight: '600' as const,
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Space.xl }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.xl,
            gap: Space.md,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="rocket" size={18} color={theme.colors.primary} />
            <AppText size={18} weight="800" style={{ flex: 1 }}>
              New project
            </AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <AppText color="textMuted" size={13} weight="500">
            A separate workspace with its own long-term goal, goals list, and notes.
          </AppText>
          <TextInput
            placeholder="Project name (e.g. Career, Fitness, Side-project)"
            placeholderTextColor={theme.colors.textFaint}
            value={name}
            onChangeText={setName}
            style={field}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
            <AppText weight="700" size={12} color="textFaint">
              TARGET YEAR
            </AppText>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              style={[field, { width: 90, textAlign: 'center' }]}
            />
          </View>

          <AppText weight="700" size={12} color="textFaint">
            COLOR
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: theme.colors.text,
                }}
              />
            ))}
          </View>

          <AppText weight="700" size={12} color="textFaint">
            ICON
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
            {ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: Radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: icon === ic ? color : theme.colors.surfaceAlt,
                }}>
                <Ionicons name={ic as any} size={19} color={icon === ic ? '#fff' : theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={submit}
            style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.pill, paddingVertical: Space.md, alignItems: 'center', marginTop: Space.sm }}>
            <AppText weight="800" color="primaryText" size={15}>
              Create project
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
