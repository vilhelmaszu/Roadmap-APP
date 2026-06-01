import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

type Segment = { value: number; color: string }; // value is a 0..1 fraction of the full ring

type Props = {
  progress: number; // 0..1 (ignored when `segments` is provided)
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
  gradientId?: string;
  segments?: Segment[]; // multi-color ring (e.g. completed green + missed red)
};

export function ProgressRing({
  progress,
  size = 120,
  stroke = 12,
  label,
  caption,
  gradientId = 'ringGrad',
  segments,
}: Props) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  // Build cumulative arc starts for multi-segment mode.
  let acc = 0;
  const arcs = (segments ?? []).map((seg, i) => {
    const frac = Math.max(0, Math.min(1, seg.value));
    const dash = frac * c;
    const dashoffset = -acc * c;
    acc += frac;
    return { key: i, color: seg.color, dash, dashoffset };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.gradientFrom} />
            <Stop offset="1" stopColor={theme.colors.gradientTo} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.track} strokeWidth={stroke} fill="none" />
        {segments ? (
          arcs.map((a) => (
            <Circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={a.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${a.dash} ${c - a.dash}`}
              strokeDashoffset={a.dashoffset}
            />
          ))
        ) : (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        )}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <AppText weight="800" size={size > 90 ? 24 : 18}>
          {label ?? `${Math.round(clamped * 100)}%`}
        </AppText>
        {caption ? (
          <AppText color="textMuted" size={11} weight="600" style={{ marginTop: 2 }}>
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
