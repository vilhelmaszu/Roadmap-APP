import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Space, ThemeColors } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

// Monospace font for the terminal design — RN gives us a built-in system mono.
const MONO_FAMILY = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export function useWide() {
  const { width } = useWindowDimensions();
  return width >= 900;
}

export function Screen({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const { theme, design } = useTheme();
  const wide = useWide();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* Neon-only terminal status bar — system telemetry styling */}
      {design.terminal && title ? <NeonStatusBar /> : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: wide ? Space.xxl : Space.lg,
          paddingTop: Space.xl,
          paddingBottom: 120,
          gap: Space.lg * design.density,
          width: '100%',
          maxWidth: 1200,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}>
        {title ? (
          <View style={{ marginBottom: Space.xs }}>
            {design.terminal ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppText size={26} weight="900" style={{ color: theme.colors.primary, letterSpacing: design.titleSpacing }}>
                  {`> ${title.toUpperCase()}_`}
                </AppText>
              </View>
            ) : (
              <AppText size={26} weight={design.titleWeight} style={{ letterSpacing: design.titleSpacing }}>
                {design.uppercaseTitles ? title.toUpperCase() : title}
              </AppText>
            )}
            {subtitle ? (
              <AppText color="textMuted" weight={design.bodyWeight} size={14} style={{ marginTop: 3 }}>
                {design.terminal ? `// ${subtitle}` : subtitle}
              </AppText>
            ) : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// Terminal-style status bar that sits above the screen title under Neon.
function NeonStatusBar() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 18,
        paddingHorizontal: Space.lg,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}>
      {[
        ['STATUS', 'ONLINE', theme.colors.success],
        ['SEC', 'ENCRYPTED', theme.colors.primary],
        ['LINK', '12ms', theme.colors.accent],
      ].map(([k, v, c]) => (
        <View key={k as string} style={{ flexDirection: 'row', gap: 4 }}>
          <Text style={{ fontFamily: MONO_FAMILY, color: theme.colors.textFaint, fontSize: 10, fontWeight: '700' }}>
            {`${k}:`}
          </Text>
          <Text style={{ fontFamily: MONO_FAMILY, color: c as string, fontSize: 10, fontWeight: '900' }}>
            {v as string}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function AppText({
  children,
  color = 'text',
  size = 15,
  weight = '500',
  style,
  numberOfLines,
}: {
  children: ReactNode;
  color?: keyof ThemeColors;
  size?: number;
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { theme, design } = useTheme();
  const mono = design.monoFont ? { fontFamily: MONO_FAMILY } : null;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { color: theme.colors[color], fontSize: Math.round(size * design.fontScale), fontWeight: weight },
        mono,
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  elevated,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  const { theme, design } = useTheme();
  const shadow =
    design.cardElevation > 0 || design.glow > 0
      ? {
          shadowColor: design.glow > 0 ? theme.colors.primary : '#000',
          shadowOpacity: design.glow > 0 ? 0.55 : design.cardElevation,
          shadowRadius: design.glow > 0 ? 14 : 8,
          shadowOffset: { width: 0, height: design.flat ? 0 : 4 },
          elevation: Math.round((design.cardElevation + design.glow) * 6),
        }
      : null;
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderRadius: design.radius,
          borderWidth: design.borderWidth,
          borderColor: theme.colors.border,
          padding: Space.lg * design.density,
        },
        shadow,
        style,
      ]}>
      {design.terminal ? <NeonCardCorner /> : null}
      {children}
    </View>
  );
}

// Decorative cyan corner brackets that appear on every card under Neon.
function NeonCardCorner() {
  const { theme } = useTheme();
  const corner = {
    position: 'absolute' as const,
    width: 10,
    height: 10,
    borderColor: theme.colors.primary,
  };
  return (
    <>
      <View style={[corner, { top: -1, left: -1, borderLeftWidth: 2, borderTopWidth: 2 }]} />
      <View style={[corner, { top: -1, right: -1, borderRightWidth: 2, borderTopWidth: 2 }]} />
      <View style={[corner, { bottom: -1, left: -1, borderLeftWidth: 2, borderBottomWidth: 2 }]} />
      <View style={[corner, { bottom: -1, right: -1, borderRightWidth: 2, borderBottomWidth: 2 }]} />
    </>
  );
}

export function Pill({ label, icon, color }: { label: string; icon?: ReactNode; color?: string }) {
  const { theme, design } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: design.pillRadius,
        paddingHorizontal: Space.md,
        paddingVertical: 6,
      }}>
      {icon}
      <Text style={{ color: color ?? theme.colors.textMuted, fontWeight: '700', fontSize: 13 }}>
        {label}
      </Text>
    </View>
  );
}

export function ProgressBar({
  progress,
  height = 10,
  color,
}: {
  progress: number;
  height?: number;
  color?: string;
}) {
  const { theme, design } = useTheme();
  const pct = Math.max(0, Math.min(1, progress));
  const barRadius = design.radius === 0 ? 0 : Radius.pill;
  return (
    <View
      style={{
        height,
        backgroundColor: theme.colors.track,
        borderRadius: barRadius,
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: color ?? theme.colors.primary,
          borderRadius: barRadius,
        }}
      />
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { theme, design } = useTheme();
  const display = design.uppercaseTitles ? title.toUpperCase() : title;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {design.terminal ? (
        <AppText size={16} weight="900" style={{ color: theme.colors.primary, letterSpacing: design.titleSpacing }}>
          {`[ ${display} ]`}
        </AppText>
      ) : (
        <AppText size={16} weight={design.titleWeight} style={{ letterSpacing: design.uppercaseTitles ? 0.5 : -0.2 }}>
          {display}
        </AppText>
      )}
      {action}
    </View>
  );
}

export function CheckBox({ checked, size = 24 }: { checked: boolean; size?: number }) {
  const { theme, design } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(7, design.radius / 2),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: checked ? theme.colors.primary : 'transparent',
        borderWidth: 2,
        borderColor: checked ? theme.colors.primary : theme.colors.textFaint,
      }}>
      {checked ? <Ionicons name="checkmark" size={size - 8} color={theme.colors.primaryText} /> : null}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  size = 18,
}: {
  name: any;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Ionicons name={name} size={size} color={color ?? theme.colors.textFaint} />
    </Pressable>
  );
}
