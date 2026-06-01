import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Stop,
} from 'react-native-svg';

// Deterministic alien-animal head. The same (seed, tier) always renders the
// same creature; tier controls how wild/elaborate it looks (1 = tame, 8 = wildest).

type Props = {
  tier: number;
  seed: number;
  size?: number;
  earned?: boolean;
  silhouette?: string; // color used when not earned
};

const PALETTES = [
  { base: '#34D399', accent: '#A3E635', dark: '#0B2018' },
  { base: '#22D3EE', accent: '#6C8BFF', dark: '#06222A' },
  { base: '#A855F7', accent: '#F472B6', dark: '#2A0F30' },
  { base: '#F97316', accent: '#FBBF24', dark: '#2A1206' },
  { base: '#F43F5E', accent: '#FB923C', dark: '#2A0F14' },
  { base: '#38BDF8', accent: '#818CF8', dark: '#06182A' },
  { base: '#84CC16', accent: '#22D3EE', dark: '#16240A' },
  { base: '#E879F9', accent: '#22D3EE', dark: '#260A2A' },
];

const EYE_BY_TIER = [1, 1, 2, 2, 3, 3, 4, 4, 5];

function eyePositions(count: number): { x: number; y: number; r: number }[] {
  switch (count) {
    case 1:
      return [{ x: 50, y: 53, r: 12 }];
    case 2:
      return [
        { x: 40, y: 52, r: 8.5 },
        { x: 60, y: 52, r: 8.5 },
      ];
    case 3:
      return [
        { x: 37, y: 55, r: 7 },
        { x: 63, y: 55, r: 7 },
        { x: 50, y: 39, r: 6 },
      ];
    case 4:
      return [
        { x: 38, y: 47, r: 6.5 },
        { x: 62, y: 47, r: 6.5 },
        { x: 42, y: 64, r: 5.5 },
        { x: 58, y: 64, r: 5.5 },
      ];
    default:
      return [
        { x: 50, y: 40, r: 6 },
        { x: 35, y: 53, r: 6 },
        { x: 65, y: 53, r: 6 },
        { x: 42, y: 67, r: 5 },
        { x: 58, y: 67, r: 5 },
      ];
  }
}

export function Creature({ tier, seed, size = 72, earned = true, silhouette = '#3A4154' }: Props) {
  const t = Math.max(1, Math.min(8, Math.round(tier)));
  const pal = PALETTES[((seed % PALETTES.length) + PALETTES.length) % PALETTES.length];
  const gid = `cg-${seed}-${t}`;

  const fill = earned ? `url(#${gid})` : silhouette;
  const stroke = earned ? pal.dark : silhouette;
  const eyeCount = EYE_BY_TIER[t];
  const eyes = eyePositions(eyeCount);

  const antennae = t >= 2 ? Math.min(3, Math.floor(t / 2)) : 0;
  const sideHorns = t >= 4;
  const topHorns = t >= 6;
  const crest = t >= 6;
  const fangs = t >= 5;
  const spots = t >= 5 ? t - 3 : 0;

  // slight head shape variation from seed
  const rx = 30 + (seed % 5);
  const ry = 31 + ((seed >> 2) % 5);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={pal.accent} />
            <Stop offset="1" stopColor={pal.base} />
          </LinearGradient>
        </Defs>

        {/* Antennae (behind head) */}
        {Array.from({ length: antennae }).map((_, i) => {
          const spread = antennae === 1 ? 0 : (i / (antennae - 1) - 0.5) * 36;
          const x = 50 + spread;
          return (
            <G key={`ant-${i}`}>
              <Line x1={x} y1={24} x2={x} y2={6 + (i % 2) * 4} stroke={stroke} strokeWidth={2.5} />
              <Circle cx={x} cy={5 + (i % 2) * 4} r={4} fill={earned ? pal.accent : silhouette} />
            </G>
          );
        })}

        {/* Top horns */}
        {topHorns ? (
          <G>
            <Polygon points="40,24 46,2 50,24" fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Polygon points="60,24 54,2 50,24" fill={fill} stroke={stroke} strokeWidth={1.5} />
          </G>
        ) : null}

        {/* Crest spikes */}
        {crest
          ? Array.from({ length: 5 }).map((_, i) => {
              const cx = 30 + i * 10;
              return (
                <Polygon
                  key={`spk-${i}`}
                  points={`${cx - 4},26 ${cx},14 ${cx + 4},26`}
                  fill={earned ? pal.base : silhouette}
                  stroke={stroke}
                  strokeWidth={1}
                />
              );
            })
          : null}

        {/* Side horns */}
        {sideHorns ? (
          <G>
            <Polygon points="22,46 6,34 24,56" fill={fill} stroke={stroke} strokeWidth={1.5} />
            <Polygon points="78,46 94,34 76,56" fill={fill} stroke={stroke} strokeWidth={1.5} />
          </G>
        ) : null}

        {/* Head */}
        <Ellipse cx={50} cy={54} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={2} />

        {/* Spots / patterns */}
        {earned
          ? Array.from({ length: spots }).map((_, i) => {
              const a = (i / Math.max(1, spots)) * Math.PI * 2 + seed;
              const cx = 50 + Math.cos(a) * 16;
              const cy = 56 + Math.sin(a) * 14;
              return <Circle key={`sp-${i}`} cx={cx} cy={cy} r={2.6} fill={pal.dark} opacity={0.5} />;
            })
          : null}

        {/* Eyes */}
        {eyes.map((e, i) => (
          <G key={`eye-${i}`}>
            <Circle cx={e.x} cy={e.y} r={e.r} fill={earned ? '#F7FBFF' : silhouette} />
            {earned && t >= 4 ? (
              <Circle cx={e.x} cy={e.y} r={e.r * 0.7} fill={pal.accent} opacity={0.6} />
            ) : null}
            <Circle
              cx={e.x}
              cy={e.y}
              r={e.r * 0.45}
              fill={earned ? '#0A0A14' : pal.dark === silhouette ? '#1A1F2C' : silhouette}
            />
            {earned ? <Circle cx={e.x - e.r * 0.2} cy={e.y - e.r * 0.25} r={e.r * 0.15} fill="#FFFFFF" /> : null}
          </G>
        ))}

        {/* Mouth */}
        {fangs ? (
          <G>
            <Path d="M40 74 Q50 82 60 74" stroke={stroke} strokeWidth={2} fill="none" />
            <Polygon points="44,75 46,82 48,75" fill={earned ? '#F7FBFF' : silhouette} />
            <Polygon points="52,75 54,82 56,75" fill={earned ? '#F7FBFF' : silhouette} />
          </G>
        ) : (
          <Path d="M43 75 Q50 79 57 75" stroke={stroke} strokeWidth={2} fill="none" />
        )}
      </Svg>
    </View>
  );
}
