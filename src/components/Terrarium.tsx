import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Creature as CreatureType } from '@/domain/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Creature } from './Creature';

type Bounds = { w: number; h: number };

// Size grows subtly with tier so the wildest beasts read as bigger.
function sizeForTier(tier: number) {
  return 44 + Math.max(1, Math.min(8, tier)) * 4; // 48 … 76
}

export function Terrarium({
  creatures,
  height = 360,
}: {
  creatures: CreatureType[];
  height?: number;
}) {
  const { theme } = useTheme();
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const ref = useRef<View>(null);

  const apply = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      setBounds((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    apply(width, h);
  };

  // onLayout can be unreliable on web after a route swap / reload — measure the
  // node directly as a fallback, retrying briefly until it reports a real width.
  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const measure = () => {
      const node: any = ref.current;
      if (node && typeof node.measure === 'function') {
        node.measure((_x: number, _y: number, w: number, h: number) => {
          if (w > 0 && h > 0) apply(w, h);
          else if (tries++ < 10) timer = setTimeout(measure, 120);
        });
      } else if (tries++ < 10) {
        timer = setTimeout(measure, 120);
      }
    };
    measure();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      style={{
        height,
        width: '100%',
        alignSelf: 'stretch',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}>
      {/* Ground band */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.42,
          backgroundColor: theme.colors.surface,
          opacity: 0.6,
        }}
      />
      {/* Soft scenery dots */}
      {bounds
        ? Array.from({ length: 14 }).map((_, i) => (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                width: 3,
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.colors.textFaint,
                opacity: 0.25,
                left: ((i * 73) % 100) * (bounds.w / 100),
                top: ((i * 37) % 60) * (bounds.h / 100),
              }}
            />
          ))
        : null}

      {bounds
        ? creatures.map((c, i) => (
            <Walker key={c.id} creature={c} index={i} bounds={bounds} />
          ))
        : null}
    </View>
  );
}

function Walker({
  creature,
  index,
  bounds,
}: {
  creature: CreatureType;
  index: number;
  bounds: Bounds;
}) {
  const { theme } = useTheme();
  const size = sizeForTier(creature.tier);
  const seed = parseInt(creature.id.replace(/\D/g, ''), 10) || index;

  const maxX = Math.max(0, bounds.w - size);
  // Keep creatures in the lower ~60% so they read as standing on the ground.
  const minY = bounds.h * 0.32;
  const maxY = Math.max(minY, bounds.h - size - 6);

  // Deterministic start so layout is stable across re-renders.
  const startX = (seed * 97) % Math.max(1, Math.floor(maxX));
  const startY = minY + ((seed * 53) % Math.max(1, Math.floor(maxY - minY)));

  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const face = useSharedValue(1);
  const bob = useSharedValue(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;

    // Gentle idle bob; wilder (higher-tier) creatures bob a touch faster.
    bob.value = withRepeat(
      withTiming(1, { duration: 900 - creature.tier * 40, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    const step = () => {
      if (!alive) return;
      const targetX = Math.random() * maxX;
      const targetY = minY + Math.random() * (maxY - minY);
      const dx = targetX - tx.value;
      const dy = targetY - ty.value;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 34 + creature.tier * 2; // px/sec
      const duration = Math.min(6000, Math.max(1400, (dist / speed) * 1000));

      face.value = dx >= 0 ? 1 : -1;
      tx.value = withTiming(targetX, { duration, easing: Easing.inOut(Easing.sin) });
      ty.value = withTiming(targetY, { duration, easing: Easing.inOut(Easing.sin) });

      const pause = 400 + Math.random() * 1600;
      timer = setTimeout(step, duration + pause);
    };

    // Stagger departures so they don't all move in lockstep.
    timer = setTimeout(step, 200 + index * 250 + Math.random() * 600);

    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimation(tx);
      cancelAnimation(ty);
      cancelAnimation(bob);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.w, bounds.h]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value - bob.value * 4 },
      { scaleX: face.value },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Creature
        tier={creature.tier}
        seed={seed}
        size={size}
        earned={creature.earned}
        silhouette={theme.colors.textFaint}
      />
    </Animated.View>
  );
}
