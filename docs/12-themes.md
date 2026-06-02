# 12 — Themes

The app ships **25 color themes**, all unlocked from the start. Settings →
Theme to switch. Choice is local to each device (not synced — you might
want dark on phone, light on PC).

## What a theme controls

Every theme defines a `ThemeColors` object
([`src/theme/themes.ts`](../src/theme/themes.ts)):

| Token | What it colors |
|---|---|
| `bg` | Page background |
| `surface` | Card background |
| `surfaceAlt` | Inner card surface (e.g. inputs, side goal rows) |
| `surfaceElevated` | Modals / overlays |
| `border` | All card / input borders |
| `text` | Primary text |
| `textMuted` | Secondary text |
| `textFaint` | Tertiary text + placeholder |
| `primary` | Primary action buttons, brand accents, progress bars |
| `primaryText` | Text color sitting on a primary background |
| `accent` | Secondary highlight (e.g. counter chips) |
| `success` | "Did it" check, success states |
| `warning` | Streak flame, vault badge |
| `danger` | Delete / "BS'd it" / destructive |
| `track` | Progress bar track |
| `gradientFrom`, `gradientTo` | Two-stop gradients on the brand logo + creatures |

Plus a `mode: 'dark' | 'light'` for status-bar styling (only matters on
mobile builds).

## Inventory

| Mode | Name | Vibe / primary color |
|---|---|---|
| dark | Midnight | Deep navy + cornflower blue (default) |
| dark | Nebula | Plum + cyclamen pink |
| dark | Slate | Charcoal + mint teal (the one you ship on) |
| light | Daylight | Crisp white + indigo |
| light | Sunrise | Peach + magenta |
| dark | Aurora | Petrol + chartreuse |
| dark | Crimson | Wine + amber |
| dark | Forest | Pine + spring green |
| dark | Ocean | Deep teal + sky blue |
| light | Sandstone | Cream + caramel |
| light | Rosé | Blush + violet |
| dark | Obsidian | Pure black + gold |
| dark | Galaxy | Indigo + cyan |
| dark | Volcano | Mahogany + orange |
| dark | Prismatic | Magenta + emerald |
| dark | Carbon | Pure black + electric blue |
| dark | Twilight | Indigo + rose-gold |
| dark | Mocha | Espresso brown + cream |
| dark | Storm | Slate blue + electric yellow |
| dark | Pine | Deep forest + lime |
| dark | Ember | Dark brown-red + amber |
| light | Glacier | Ice blue + steel |
| light | Coral | Peach + teal |
| dark | Emerald | Deep emerald + gold |
| dark | Copper | Warm brown + copper-bronze |

All 25 are accessible from Settings → Theme. None are gated behind XP /
achievements anymore — earlier versions locked some until milestones, but
that was stripped because you wanted everything available immediately.

## Adding a new theme

```ts
// in src/theme/themes.ts, append to THEMES array:
{
  id: 'your-id',
  name: 'Your Name',
  mode: 'dark',
  colors: {
    bg: '#...',
    surface: '#...',
    surfaceAlt: '#...',
    surfaceElevated: '#...',
    border: '#...',
    text: '#...',
    textMuted: '#...',
    textFaint: '#...',
    primary: '#...',
    primaryText: '#...',
    accent: '#...',
    success: '#...',
    warning: '#...',
    danger: '#...',
    track: '#...',
    gradientFrom: '#...',
    gradientTo: '#...',
  },
},
```

Sanity-check by setting it active in Settings → Theme and scrolling through
every screen — Dashboard, Roadmap, Goals, Growth, Insights, Terrarium,
Notes, Settings — to confirm contrast holds up.

## The timeframe palette

Separate from themes — these colors live in
[`src/domain/logic.ts`](../src/domain/logic.ts) and don't change across
themes (they're a visual code for timeframe across the whole app):

```ts
export const TIMEFRAME_COLOR: Record<Timeframe, string> = {
  daily:   '#34D399',   // mint green
  weekly:  '#3B82F6',   // blue
  monthly: '#EF4444',   // red
  yearly:  '#FBBF24',   // amber
  none:    '#A855F7',   // bright purple — for "indefinite / ongoing" goals
};
```

The `none` value used to be muted grey and faded into the chrome.
Bumped to a saturated purple so indefinite goals are visible at a glance.

## Designs (different from themes)

A second axis controls typography + density + shape. Lives in
[`src/theme/design.ts`](../src/theme/design.ts):

- **Newspaper** (default) — uppercase headers, hard corners, editorial weight
- **Cyber** — monospace, neon glow, cyan corner brackets, terminal-style
  `> TITLE_` headers, `[ BRACKETED ]` sections

Themes and designs are orthogonal — you can use any of the 25 colors with
either design. Settings → Design to switch.

Note: Cyber's `design.enforcedColors` overrides whatever theme is active,
because the terminal aesthetic only really works in green-on-black.
