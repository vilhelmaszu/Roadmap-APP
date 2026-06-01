import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const COLORS = ['#6C8BFF', '#22D3EE', '#A855F7', '#F472B6', '#34D399', '#FBBF24', '#FB7185'];

// A lightweight one-shot confetti burst. Overlays its parent; renders nothing structural.
export function Confetti({ count = 28 }: { count?: number }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 1200);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} index={i} count={count} width={w} />
      ))}
    </View>
  );
}

function Piece({ index, count, width }: { index: number; count: number; width: number }) {
  const t = useSharedValue(0);
  // Deterministic spread from index — scattered look without per-frame randomness.
  const startX = (width / count) * index + ((index * 37) % 24) - 12;
  const drift = ((index * 53) % 80) - 40;
  const size = 6 + (index % 3) * 3;
  const color = COLORS[index % COLORS.length];
  const spin = index % 2 === 0 ? 1 : -1;

  useEffect(() => {
    t.value = withTiming(1, { duration: 1500 + (index % 5) * 120, easing: Easing.out(Easing.quad) });
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -20,
    left: startX,
    width: size,
    height: size * 1.6,
    borderRadius: 2,
    backgroundColor: color,
    opacity: 1 - t.value * 0.9,
    transform: [
      { translateY: t.value * 720 },
      { translateX: t.value * drift },
      { rotate: `${t.value * 360 * spin}deg` },
    ],
  }));

  return <Animated.View style={style} />;
}
