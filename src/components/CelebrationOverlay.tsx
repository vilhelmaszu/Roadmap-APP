import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';

import { buildAchievements, creatureForAchievement } from '@/domain/logic';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { Confetti } from './Confetti';
import { Creature } from './Creature';
import { AppText } from './ui';

export function CelebrationOverlay() {
  const { theme } = useTheme();
  const lastLevelUp = useStore((s) => s.lastLevelUp);
  const lastBadgeId = useStore((s) => s.lastBadgeId);
  const profile = useStore((s) => s.profile);
  const clear = useStore((s) => s.clearCelebrations);

  const visible = lastLevelUp != null || lastBadgeId != null;
  if (!visible) return null;

  const isLevel = lastLevelUp != null;
  const badge = lastBadgeId ? buildAchievements(profile).find((a) => a.id === lastBadgeId) : undefined;
  const creature = lastBadgeId ? creatureForAchievement(profile, lastBadgeId) : undefined;
  const hasCreature = !isLevel && !!creature;
  const seed = creature ? parseInt(creature.id.replace(/\D/g, ''), 10) || 0 : 0;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={clear}>
      <Pressable
        onPress={clear}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.xl,
        }}>
        <Confetti />
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            padding: Space.xxl,
            alignItems: 'center',
            width: '100%',
            maxWidth: 360,
          }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Space.lg,
            }}>
            {hasCreature ? (
              <Creature tier={creature!.tier} seed={seed} size={96} earned />
            ) : (
              <Ionicons
                name={isLevel ? 'trending-up' : ((badge?.icon as any) ?? 'trophy')}
                size={48}
                color={theme.colors.primary}
              />
            )}
          </View>
          <AppText size={13} weight="800" color="primary">
            {isLevel ? 'LEVEL UP' : hasCreature ? 'CREATURE DISCOVERED' : 'ACHIEVEMENT UNLOCKED'}
          </AppText>
          <AppText size={24} weight="800" style={{ marginTop: 6, textAlign: 'center' }}>
            {isLevel
              ? `Level ${lastLevelUp}`
              : hasCreature
                ? creature!.name
                : (badge?.label ?? 'New achievement')}
          </AppText>
          <AppText color="textMuted" weight="600" style={{ marginTop: 6, textAlign: 'center' }}>
            {isLevel
              ? 'Keep the momentum going!'
              : hasCreature
                ? `${creature!.name} joins your collection — unlocked by "${badge?.label}".`
                : (badge?.description ?? '')}
          </AppText>
          <Pressable
            onPress={clear}
            style={{
              marginTop: Space.xl,
              backgroundColor: theme.colors.primary,
              borderRadius: Radius.pill,
              paddingHorizontal: Space.xxl,
              paddingVertical: Space.md,
            }}>
            <AppText weight="800" color="primaryText">
              Nice!
            </AppText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
