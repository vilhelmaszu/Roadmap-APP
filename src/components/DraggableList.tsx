import { ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Item = { id: string };
type Positions = Record<string, number>;

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.max(lo, Math.min(hi, v));
}

function objectMove(obj: Positions, from: number, to: number): Positions {
  'worklet';
  const next: Positions = {};
  for (const id in obj) {
    const p = obj[id];
    if (p === from) next[id] = to;
    else if (from < to && p > from && p <= to) next[id] = p - 1;
    else if (from > to && p >= to && p < from) next[id] = p + 1;
    else next[id] = p;
  }
  return next;
}

// A fixed-row-height drag-to-reorder list built on Reanimated + gesture-handler.
export function DraggableList<T extends Item>({
  data,
  itemHeight,
  gap = 8,
  renderItem,
  onReorder,
}: {
  data: T[];
  itemHeight: number;
  gap?: number;
  renderItem: (item: T) => ReactNode;
  onReorder: (orderedIds: string[]) => void;
}) {
  const rowH = itemHeight + gap;
  const positions = useSharedValue<Positions>(
    Object.fromEntries(data.map((d, i) => [d.id, i])),
  );

  // Keep positions in sync when the underlying data set changes.
  const key = data.map((d) => d.id).join(',');
  const synced = useSharedValue('');
  if (synced.value !== key) {
    synced.value = key;
    positions.value = Object.fromEntries(data.map((d, i) => [d.id, i]));
  }

  const commit = () => {
    const ids = Object.keys(positions.value).sort((a, b) => positions.value[a] - positions.value[b]);
    onReorder(ids);
  };

  return (
    <View style={{ height: data.length * rowH }}>
      {data.map((item) => (
        <Row
          key={item.id}
          id={item.id}
          positions={positions}
          rowH={rowH}
          count={data.length}
          onCommit={commit}>
          {renderItem(item)}
        </Row>
      ))}
    </View>
  );
}

function Row({
  id,
  positions,
  rowH,
  count,
  onCommit,
  children,
}: {
  id: string;
  positions: SharedValue<Positions>;
  rowH: number;
  count: number;
  onCommit: () => void;
  children: ReactNode;
}) {
  const active = useSharedValue(false);
  const top = useSharedValue((positions.value[id] ?? 0) * rowH);

  useAnimatedReaction(
    () => positions.value[id],
    (cur, prev) => {
      if (cur !== prev && cur != null && !active.value) {
        top.value = withSpring(cur * rowH, { damping: 20, stiffness: 200 });
      }
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      active.value = true;
    })
    .onUpdate((e) => {
      const start = (positions.value[id] ?? 0) * rowH;
      top.value = start + e.translationY;
      const newIndex = clamp(Math.round(top.value / rowH), 0, count - 1);
      const oldIndex = positions.value[id];
      if (newIndex !== oldIndex) {
        positions.value = objectMove(positions.value, oldIndex, newIndex);
      }
    })
    .onEnd(() => {
      top.value = withSpring((positions.value[id] ?? 0) * rowH, { damping: 20, stiffness: 200 });
    })
    .onFinalize(() => {
      if (active.value) {
        active.value = false;
        runOnJS(onCommit)();
      }
    });

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: top.value,
    zIndex: active.value ? 10 : 0,
    transform: [{ scale: withSpring(active.value ? 1.03 : 1) }],
    shadowOpacity: active.value ? 0.3 : 0,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  }));

  return (
    <Animated.View style={style}>
      <GestureDetector gesture={pan}>
        <View>{children}</View>
      </GestureDetector>
    </Animated.View>
  );
}
