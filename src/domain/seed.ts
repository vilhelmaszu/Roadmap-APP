import { Goal, GoalSet, Note, PlanPoint, Profile, Project, Recurrence, Timeframe, Vision } from './types';

// Seed: the morimake.com 5-year roadmap, broken down into six workspaces.
// Each project owns its own vision; phase parents render as top-level goals
// grouped by timeframe, and their sub-tasks nest underneath. Seeded notes
// (one per project) mirror the full breakdown as plain text so the roadmap
// can be reread + adjusted directly in the Notes tab.

const NOW = Date.now();
const YEAR = new Date().getFullYear();

let ORDER = 0;
const nextOrder = () => ORDER++;

function points(prefix: string, items: string[]): PlanPoint[] {
  return items.map((t, i) => ({ id: `${prefix}-pt-${i}`, text: t, done: false }));
}

type GoalSpec = {
  id: string;
  title: string;
  timeframe: Timeframe;
  parentId?: string;
  recurrence?: Recurrence;
  notes?: string;
  points?: string[];
};

function goal(projectId: string, category: string, spec: GoalSpec): Goal {
  const recurring = !!spec.recurrence && spec.recurrence !== 'none';
  return {
    id: spec.id,
    title: spec.title,
    notes: spec.notes,
    timeframe: spec.timeframe,
    category,
    projectId,
    parentId: spec.parentId,
    recurrence: spec.recurrence,
    habitId: recurring ? spec.id : undefined,
    order: nextOrder(),
    done: false,
    createdAt: NOW,
    points: spec.points ? points(spec.id, spec.points) : [],
  };
}

// --- Visions ---------------------------------------------------------------

const visionP1: Vision = {
  id: 'v-p1',
  title: 'Ship the Marketing Suite — a one-app campaign engine',
  why: 'Replace HighLevel-class workflows for a solo operator: avatars, strategies, social posts, GSC + GA4, all in one place.',
  targetYear: YEAR + 2,
  points: points('v-p1', [
    'Competitor research complete, MVP cut locked',
    'Architecture + ERD signed off before any code',
    'Avatar generator shipped',
    'Strategy + tactic generator shipped',
    'Social post generator shipped',
    'GSC + GA4 integrations live',
    "Running morimake.com's own marketing through the app",
  ]),
};

const visionP2: Vision = {
  id: 'v-p2',
  title: 'morimake.com reads as tier-1 tech on first contact',
  why: 'Three signature landing pages, a launch video set, and a content engine that posts daily across every channel.',
  targetYear: YEAR + 1,
  points: points('v-p2', [
    'Three cinematic landing pages live',
    '3–6 hero launch videos shipped',
    'FB / IG / TikTok / X / LinkedIn / YouTube branded and active',
    'Daily posting cadence sustained for 90 days',
    'Reddit auto-commenter agent live with human-in-loop',
    '20–50 video experiments produced, top 2 techniques identified',
  ]),
};

const visionP3: Vision = {
  id: 'v-p3',
  title: 'Daily outbound machine that books 2–5 calls per week',
  why: 'Improve the existing email generator into a deliverable, personalized, measurable outbound engine — then run it daily.',
  targetYear: YEAR + 1,
  points: points('v-p3', [
    'Existing program audited, improvement plan written',
    'Deliverability hardened (SPF / DKIM / DMARC, warm-up)',
    'Per-lead personalization via Claude first-line',
    'Reply tracking + CRM-lite shipped',
    '1,500+ emails sent in Year 1',
  ]),
};

const visionP4: Vision = {
  id: 'v-p4',
  title: 'Operate at a senior level across marketing, sales, comms, and applied AI',
  why: 'Skill is the lubricant for every other project — never let it go quiet for more than a week.',
  targetYear: YEAR + 1,
  points: points('v-p4', [
    'Marketing canon read + applied to morimake',
    'Sales canon read + 50+ live pitch reps',
    'Daily writing rep sustained',
    'Anthropic + OpenAI docs end-to-end',
    'One agent shipped per month against a real business need',
  ]),
};

const visionP5: Vision = {
  id: 'v-p5',
  title: 'A reliable morning topic digest delivered to my phone',
  why: 'Small, focused agent. Telegram bot, curated topic, summary at a scheduled time.',
  targetYear: YEAR + 1,
  points: points('v-p5', [
    'Spec locked (topics, sources, format, delivery time)',
    'Build complete (scrapers → summarizer → bot → scheduler)',
    'Running daily for 30 days uninterrupted',
  ]),
};

const visionP6: Vision = {
  id: 'v-p6',
  title: 'Ship + showcase 10–50 small programs over 2 years',
  why: 'Every shipped program feeds the morimake content engine and proves the brand can build.',
  targetYear: YEAR + 2,
  indefinite: false,
  points: points('v-p6', [
    'Backlog of 10–50 ideas captured and ranked',
    'Monthly cadence: 1 small program shipped end-to-end',
    'Every ship triggers a showcase post + an in-app test',
    'Quarterly sunset of programs that do not pull weight',
  ]),
};

// --- Projects --------------------------------------------------------------

export const seedProjects: Project[] = [
  { id: 'p1', name: 'Marketing Suite App', color: '#FF6B6B', icon: 'megaphone', vision: visionP1, createdAt: NOW },
  { id: 'p2', name: 'morimake.com Brand', color: '#B388FF', icon: 'globe', vision: visionP2, createdAt: NOW },
  { id: 'p3', name: 'Email Outreach Engine', color: '#4ECDC4', icon: 'mail', vision: visionP3, createdAt: NOW },
  { id: 'p4', name: 'Learning Track', color: '#FFD166', icon: 'school', vision: visionP4, createdAt: NOW },
  { id: 'p5', name: 'News Telegram Bot', color: '#06D6A0', icon: 'newspaper', vision: visionP5, createdAt: NOW },
  { id: 'p6', name: 'Program Portfolio', color: '#F4A261', icon: 'cube', vision: visionP6, createdAt: NOW },
];

// Active workspace on first load.
export const seedActiveProjectId = 'p1';

// Legacy alias — the vision mirror on the store points at the active project.
export const seedVision = visionP1;

// --- Goals: P1 Marketing Suite App -----------------------------------------

const goalsP1: Goal[] = [
  // Phase 1.1 — Competitor & feature research
  goal('p1', 'Research', { id: 'p1-1', title: 'Phase 1.1 — Competitor & feature research', timeframe: 'monthly' }),
  goal('p1', 'Research', { id: 'p1-1-1', parentId: 'p1-1', timeframe: 'weekly', title: 'Tear down HighLevel: pricing, feature map, gaps' }),
  goal('p1', 'Research', { id: 'p1-1-2', parentId: 'p1-1', timeframe: 'weekly', title: 'Tear down Jasper / Buffer / Hootsuite / Ocoya / Predis.ai' }),
  goal('p1', 'Research', { id: 'p1-1-3', parentId: 'p1-1', timeframe: 'weekly', title: 'Write "what we do differently" one-pager' }),
  goal('p1', 'Research', { id: 'p1-1-4', parentId: 'p1-1', timeframe: 'weekly', title: 'Lock MVP cut: must / should / later' }),

  // Phase 1.2 — Architecture plan
  goal('p1', 'Architecture', { id: 'p1-2', title: 'Phase 1.2 — Architecture plan (finish BEFORE any code)', timeframe: 'monthly' }),
  goal('p1', 'Architecture', { id: 'p1-2-1', parentId: 'p1-2', timeframe: 'weekly', title: 'Domain model: Project → Campaign → Strategy → Tactic → Asset' }),
  goal('p1', 'Architecture', { id: 'p1-2-2', parentId: 'p1-2', timeframe: 'weekly', title: 'Avatar schema (demographics, psychographics, channels, pain points, voice)' }),
  goal('p1', 'Architecture', { id: 'p1-2-3', parentId: 'p1-2', timeframe: 'weekly', title: 'Integration list + auth model (GSC, Meta Graph, TikTok, X, GA4, Mailchimp)' }),
  goal('p1', 'Architecture', { id: 'p1-2-4', parentId: 'p1-2', timeframe: 'weekly', title: 'Stack decision (likely Next.js + Postgres + Claude API)' }),
  goal('p1', 'Architecture', { id: 'p1-2-5', parentId: 'p1-2', timeframe: 'weekly', title: 'Full ERD + system diagram signed off' }),

  // Phase 1.3 — Avatar generator module
  goal('p1', 'Build', { id: 'p1-3', title: 'Phase 1.3 — Avatar generator module', timeframe: 'yearly' }),
  goal('p1', 'Build', { id: 'p1-3-1', parentId: 'p1-3', timeframe: 'monthly', title: 'Avatar form: target market, region, age, income, behavior' }),
  goal('p1', 'Build', { id: 'p1-3-1b', parentId: 'p1-3', timeframe: 'monthly', title: 'Where the avatar hangs out — digital channels (subreddits, IG creators, YouTube, Discord, podcasts)' }),
  goal('p1', 'Build', { id: 'p1-3-1c', parentId: 'p1-3', timeframe: 'monthly', title: 'Where the avatar hangs out — physical/offline (events, neighbourhoods, stores, meetups)' }),
  goal('p1', 'Build', { id: 'p1-3-2', parentId: 'p1-3', timeframe: 'monthly', title: 'Claude enrichment: objections, language patterns, voice samples' }),
  goal('p1', 'Build', { id: 'p1-3-3', parentId: 'p1-3', timeframe: 'monthly', title: 'Save / version / clone avatars per project' }),
  goal('p1', 'Build', { id: 'p1-3-4', parentId: 'p1-3', timeframe: 'monthly', title: 'Avatar → campaign brief generator' }),

  // Phase 1.4 — Strategy + tactic generator
  goal('p1', 'Build', { id: 'p1-4', title: 'Phase 1.4 — Strategy + tactic generator', timeframe: 'yearly' }),
  goal('p1', 'Build', { id: 'p1-4-1', parentId: 'p1-4', timeframe: 'monthly', title: 'Strategy templates: awareness / conversion / retention / launch' }),
  goal('p1', 'Build', { id: 'p1-4-2', parentId: 'p1-4', timeframe: 'monthly', title: 'Tactic decomposition from strategy' }),
  goal('p1', 'Build', { id: 'p1-4-3', parentId: 'p1-4', timeframe: 'monthly', title: 'Channel mix recommendation from avatar' }),
  goal('p1', 'Build', { id: 'p1-4-4', parentId: 'p1-4', timeframe: 'monthly', title: 'Campaign timeline export (Gantt)' }),

  // Phase 1.5 — Social post generator
  goal('p1', 'Build', { id: 'p1-5', title: 'Phase 1.5 — Social post generator', timeframe: 'yearly' }),
  goal('p1', 'Build', { id: 'p1-5-1', parentId: 'p1-5', timeframe: 'monthly', title: 'Pipeline: brief → draft → human-voice → hashtags → image prompt' }),
  goal('p1', 'Build', { id: 'p1-5-2', parentId: 'p1-5', timeframe: 'monthly', title: 'Anti-AI-tells filter (so the copy never sounds AI)' }),
  goal('p1', 'Build', { id: 'p1-5-3', parentId: 'p1-5', timeframe: 'monthly', title: 'Realistic image generation (best-in-class model)' }),
  goal('p1', 'Build', { id: 'p1-5-3b', parentId: 'p1-5', timeframe: 'monthly', title: 'Image realism human-eval pass — 10 sample posts must look fully real before shipping' }),
  goal('p1', 'Build', { id: 'p1-5-4', parentId: 'p1-5', timeframe: 'monthly', title: 'Preview popup: IG / FB / TikTok / X / LinkedIn on iPhone, Pixel, desktop frames' }),
  goal('p1', 'Build', { id: 'p1-5-5', parentId: 'p1-5', timeframe: 'monthly', title: 'Inline editor for copy + image + hashtags' }),
  goal('p1', 'Build', { id: 'p1-5-6', parentId: 'p1-5', timeframe: 'monthly', title: 'Schedule + publish via official APIs' }),

  // Phase 1.6 — GSC + analytics
  goal('p1', 'Integrations', { id: 'p1-6', title: 'Phase 1.6 — GSC + analytics', timeframe: 'yearly' }),
  goal('p1', 'Integrations', { id: 'p1-6-1', parentId: 'p1-6', timeframe: 'monthly', title: 'OAuth GSC → queries + pages' }),
  goal('p1', 'Integrations', { id: 'p1-6-2', parentId: 'p1-6', timeframe: 'monthly', title: 'GA4 connector' }),
  goal('p1', 'Integrations', { id: 'p1-6-3', parentId: 'p1-6', timeframe: 'monthly', title: 'Insight cards: rising queries, decaying pages, CTR outliers' }),

  // Phase 1.7 — Use it on our own brand + launch
  goal('p1', 'Launch', { id: 'p1-7', title: "Phase 1.7 — Use it on morimake.com + public launch", timeframe: 'yearly' }),
  goal('p1', 'Launch', { id: 'p1-7-1', parentId: 'p1-7', timeframe: 'monthly', title: "Run morimake.com's marketing through the app end-to-end" }),
];

// --- Goals: P2 morimake.com Brand & Web Presence ---------------------------

const goalsP2: Goal[] = [
  // Phase 2.1 — Three cinematic landing pages
  goal('p2', 'Web', { id: 'p2-1', title: 'Phase 2.1 — Three cinematic landing pages', timeframe: 'yearly' }),
  goal('p2', 'Web', { id: 'p2-1-0', parentId: 'p2-1', timeframe: 'weekly', title: 'Mood board + reference scrape (do FIRST)' }),
  goal('p2', 'Web', { id: 'p2-1-1', parentId: 'p2-1', timeframe: 'monthly', title: 'Page A — red black-hole on shifting dark-red, video-like motion' }),
  goal('p2', 'Web', { id: 'p2-1-2', parentId: 'p2-1', timeframe: 'monthly', title: 'Page B — purple × green high-strike concept' }),
  goal('p2', 'Web', { id: 'p2-1-3', parentId: 'p2-1', timeframe: 'monthly', title: 'Page C — third concept (define in mood board step)' }),
  goal('p2', 'Web', { id: 'p2-1-4', parentId: 'p2-1', timeframe: 'weekly', title: 'Tooling shortlist: Framer / Spline / Rive / Lottie / Three.js' }),
  goal('p2', 'Web', { id: 'p2-1-4b', parentId: 'p2-1', timeframe: 'weekly', title: 'Evaluate AI design tools (Lovable, v0, Krea, Midjourney, Recraft, Galileo) for landing-page generation' }),
  goal('p2', 'Web', { id: 'p2-1-5', parentId: 'p2-1', timeframe: 'monthly', title: 'Build A → B → C' }),
  goal('p2', 'Web', { id: 'p2-1-6', parentId: 'p2-1', timeframe: 'weekly', title: 'Performance budget: LCP < 2.5s, no jank on mid-tier mobile' }),

  // Phase 2.2 — Launch video set
  goal('p2', 'Video', { id: 'p2-2', title: 'Phase 2.2 — Launch video set', timeframe: 'monthly' }),
  goal('p2', 'Video', { id: 'p2-2-1', parentId: 'p2-2', timeframe: 'weekly', title: '3–6 hero videos showcasing the three sites' }),
  goal('p2', 'Video', { id: 'p2-2-2', parentId: 'p2-2', timeframe: 'weekly', title: 'Vertical + horizontal cut per video' }),
  goal('p2', 'Video', { id: 'p2-2-3', parentId: 'p2-2', timeframe: 'weekly', title: '3 thumbnail + hook variants per video' }),
  goal('p2', 'Video', { id: 'p2-2-4', parentId: 'p2-2', timeframe: 'weekly', title: 'Post the hero videos on every marketing channel' }),

  // Phase 2.3 — Social accounts setup
  goal('p2', 'Social', { id: 'p2-3', title: 'Phase 2.3 — Social accounts setup', timeframe: 'weekly' }),
  goal('p2', 'Social', { id: 'p2-3-1', parentId: 'p2-3', timeframe: 'weekly', title: 'Create + brand FB, IG, TikTok, X, LinkedIn, YouTube for morimake.com' }),
  goal('p2', 'Social', { id: 'p2-3-2', parentId: 'p2-3', timeframe: 'weekly', title: 'Bio + link-in-bio page + pinned post on each' }),
  goal('p2', 'Social', { id: 'p2-3-3', parentId: 'p2-3', timeframe: 'weekly', title: 'Tracking pixels + UTMs wired' }),

  // Phase 2.4 — Posting engine
  goal('p2', 'Posting', { id: 'p2-4', title: 'Phase 2.4 — Posting engine', timeframe: 'monthly' }),
  goal('p2', 'Posting', { id: 'p2-4-1', parentId: 'p2-4', timeframe: 'weekly', title: 'Posting plan doc — pillars, cadence, channel mix (write FIRST, no posting before this)' }),
  goal('p2', 'Posting', { id: 'p2-4-1b', parentId: 'p2-4', timeframe: 'weekly', title: 'Growth model + KPIs locked (reach / engagement / follows / link-clicks targets per channel)' }),
  goal('p2', 'Posting', { id: 'p2-4-1c', parentId: 'p2-4', timeframe: 'weekly', title: 'Scheduled posting calendar — visible 4 weeks ahead per channel' }),
  goal('p2', 'Posting', { id: 'p2-4-2', parentId: 'p2-4', timeframe: 'daily', recurrence: 'daily', title: 'Post on at least one channel (min 5×/week aggregate)' }),
  goal('p2', 'Posting', { id: 'p2-4-3', parentId: 'p2-4', timeframe: 'weekly', recurrence: 'weekly', title: '1 long-form video or carousel' }),
  goal('p2', 'Posting', { id: 'p2-4-4', parentId: 'p2-4', timeframe: 'weekly', recurrence: 'weekly', title: 'Reach + engagement review, adjust pillar mix' }),
  goal('p2', 'Posting', { id: 'p2-4-5', parentId: 'p2-4', timeframe: 'monthly', recurrence: 'monthly', title: 'Cohort retention review' }),
  goal('p2', 'Posting', { id: 'p2-4-6', parentId: 'p2-4', timeframe: 'monthly', title: 'Wire the P1 publisher into the live posting pipeline (when v0.1 ships)' }),

  // Phase 2.5 — Program showcase posts
  goal('p2', 'Posting', { id: 'p2-5', title: 'Phase 2.5 — Program showcase posts (fed by P6)', timeframe: 'weekly' }),
  goal('p2', 'Posting', { id: 'p2-5-1', parentId: 'p2-5', timeframe: 'weekly', title: 'Ship-log post template (small → big)' }),
  goal('p2', 'Posting', { id: 'p2-5-2', parentId: 'p2-5', timeframe: 'weekly', title: 'Video + image variant per shipped program' }),
  goal('p2', 'Posting', { id: 'p2-5-3', parentId: 'p2-5', timeframe: 'monthly', title: 'Cross-post automation (uses P1 Marketing Suite)' }),

  // Phase 2.6 — Reddit auto-commenter agent (idea 4.1)
  goal('p2', 'Agents', { id: 'p2-6', title: 'Phase 2.6 — Reddit auto-commenter agent', timeframe: 'yearly' }),
  goal('p2', 'Agents', { id: 'p2-6-1', parentId: 'p2-6', timeframe: 'weekly', title: 'Subreddit map + per-sub rules audit (read BEFORE building)' }),
  goal('p2', 'Agents', { id: 'p2-6-2', parentId: 'p2-6', timeframe: 'weekly', title: 'Compliance gate: Reddit ToS, anti-spam, ban-risk model' }),
  goal('p2', 'Agents', { id: 'p2-6-3', parentId: 'p2-6', timeframe: 'monthly', title: 'Agent design: Claude + Reddit API, value-first comment policy, mention cap per thread' }),
  goal('p2', 'Agents', { id: 'p2-6-4', parentId: 'p2-6', timeframe: 'monthly', title: 'Human-in-loop approval queue (no auto-send Day 1)' }),
  goal('p2', 'Agents', { id: 'p2-6-5', parentId: 'p2-6', timeframe: 'monthly', title: 'Gradual autonomy ramp + metrics (karma, reports, bans)' }),

  // Phase 2.7 — Video creation experiments (idea 5)
  goal('p2', 'Video', { id: 'p2-7', title: 'Phase 2.7 — Video creation experiments (20–50 videos)', timeframe: 'yearly' }),
  goal('p2', 'Video', { id: 'p2-7-1', parentId: 'p2-7', timeframe: 'weekly', title: 'Pick 5 techniques: talking-head, AI-avatar, dev-log screen-rec, motion graphic, doc-style' }),
  goal('p2', 'Video', { id: 'p2-7-2', parentId: 'p2-7', timeframe: 'monthly', title: 'Produce 4–10 videos per technique → 20–50 total' }),
  goal('p2', 'Video', { id: 'p2-7-3', parentId: 'p2-7', timeframe: 'monthly', title: 'Post + measure; double down on top 2 techniques' }),
];

// --- Goals: P3 Business Email Outreach Engine ------------------------------

const goalsP3: Goal[] = [
  goal('p3', 'Program', { id: 'p3-1', title: 'Phase 3.1 — Improve the existing program (PLAN before edits)', timeframe: 'monthly' }),
  goal('p3', 'Program', { id: 'p3-1-1', parentId: 'p3-1', timeframe: 'weekly', title: 'Audit current program: capabilities, gaps, broken bits' }),
  goal('p3', 'Program', { id: 'p3-1-2', parentId: 'p3-1', timeframe: 'weekly', title: 'Improvement plan doc — scope, sequencing, definition of done' }),
  goal('p3', 'Program', { id: 'p3-1-3', parentId: 'p3-1', timeframe: 'weekly', title: 'Better targeting (industry, size, intent signals)' }),
  goal('p3', 'Program', { id: 'p3-1-4', parentId: 'p3-1', timeframe: 'weekly', title: 'Better personalization (Claude first-line generator)' }),
  goal('p3', 'Program', { id: 'p3-1-5', parentId: 'p3-1', timeframe: 'weekly', title: 'Deliverability: SPF / DKIM / DMARC, warm-up, send caps' }),
  goal('p3', 'Program', { id: 'p3-1-6', parentId: 'p3-1', timeframe: 'monthly', title: 'Reply tracking + CRM-lite' }),

  goal('p3', 'Outbound', { id: 'p3-2', title: 'Phase 3.2 — Daily sending', timeframe: 'monthly' }),
  goal('p3', 'Outbound', { id: 'p3-2-1', parentId: 'p3-2', timeframe: 'daily', recurrence: 'daily', title: 'Send 5–10 personalized emails' }),
  goal('p3', 'Outbound', { id: 'p3-2-2', parentId: 'p3-2', timeframe: 'daily', recurrence: 'daily', title: 'Log + classify replies (interested / not / bounce)' }),
  goal('p3', 'Outbound', { id: 'p3-2-3', parentId: 'p3-2', timeframe: 'weekly', recurrence: 'weekly', title: 'A/B test subject + opener' }),
  goal('p3', 'Outbound', { id: 'p3-2-4', parentId: 'p3-2', timeframe: 'monthly', recurrence: 'monthly', title: 'Funnel review, kill dead segments' }),
];

// --- Goals: P4 Learning Track ----------------------------------------------

const goalsP4: Goal[] = [
  goal('p4', 'Marketing', { id: 'p4-1', title: 'Phase 4.1 — Marketing fundamentals', timeframe: 'yearly' }),
  goal('p4', 'Marketing', { id: 'p4-1-1', parentId: 'p4-1', timeframe: 'monthly', title: 'Read: Breakthrough Advertising' }),
  goal('p4', 'Marketing', { id: 'p4-1-2', parentId: 'p4-1', timeframe: 'monthly', title: 'Read: Building a StoryBrand' }),
  goal('p4', 'Marketing', { id: 'p4-1-3', parentId: 'p4-1', timeframe: 'monthly', title: 'Read: Hooked' }),
  goal('p4', 'Marketing', { id: 'p4-1-4', parentId: 'p4-1', timeframe: 'monthly', title: 'Read: $100M Offers' }),
  goal('p4', 'Marketing', { id: 'p4-1-5', parentId: 'p4-1', timeframe: 'weekly', recurrence: 'weekly', title: '1 chapter + 1-page synthesis applied to morimake' }),

  goal('p4', 'Sales', { id: 'p4-2', title: 'Phase 4.2 — Sales', timeframe: 'yearly' }),
  goal('p4', 'Sales', { id: 'p4-2-1', parentId: 'p4-2', timeframe: 'monthly', title: 'Read: SPIN Selling' }),
  goal('p4', 'Sales', { id: 'p4-2-2', parentId: 'p4-2', timeframe: 'monthly', title: 'Read: Never Split the Difference' }),
  goal('p4', 'Sales', { id: 'p4-2-3', parentId: 'p4-2', timeframe: 'monthly', title: 'Read: Way of the Wolf' }),
  goal('p4', 'Sales', { id: 'p4-2-4', parentId: 'p4-2', timeframe: 'weekly', recurrence: 'weekly', title: '1 cold call or live pitch role-play' }),

  goal('p4', 'Writing', { id: 'p4-3', title: 'Phase 4.3 — Communication & writing', timeframe: 'yearly' }),
  goal('p4', 'Writing', { id: 'p4-3-1', parentId: 'p4-3', timeframe: 'monthly', title: 'Read: On Writing Well' }),
  goal('p4', 'Writing', { id: 'p4-3-2', parentId: 'p4-3', timeframe: 'monthly', title: 'Read: Ogilvy on Advertising' }),
  goal('p4', 'Writing', { id: 'p4-3-3', parentId: 'p4-3', timeframe: 'monthly', title: 'Read: Adweek Copywriting Handbook' }),
  goal('p4', 'Writing', { id: 'p4-3-4', parentId: 'p4-3', timeframe: 'daily', recurrence: 'daily', title: '200-word writing rep (post, email, or doc)' }),

  goal('p4', 'AI', { id: 'p4-4', title: 'Phase 4.4 — AI control & engineering', timeframe: 'yearly' }),
  goal('p4', 'AI', { id: 'p4-4-1', parentId: 'p4-4', timeframe: 'monthly', title: 'Anthropic + OpenAI docs end-to-end' }),
  goal('p4', 'AI', { id: 'p4-4-2', parentId: 'p4-4', timeframe: 'monthly', title: 'Agent frameworks: Claude Agent SDK, LangGraph, OpenAI Agents' }),
  goal('p4', 'AI', { id: 'p4-4-3', parentId: 'p4-4', timeframe: 'monthly', title: 'RAG + evals + tool use mastered before scaling agents' }),
  goal('p4', 'AI', { id: 'p4-4-4', parentId: 'p4-4', timeframe: 'monthly', recurrence: 'monthly', title: 'Ship 1 agent tied to a real business need' }),
];

// --- Goals: P5 News Telegram Bot -------------------------------------------

const goalsP5: Goal[] = [
  goal('p5', 'Spec', { id: 'p5-1', title: 'Phase 5.1 — Spec', timeframe: 'monthly' }),
  goal('p5', 'Spec', { id: 'p5-1-1', parentId: 'p5-1', timeframe: 'weekly', title: 'Topics, sources, dedup, delivery time, format' }),

  goal('p5', 'Build', { id: 'p5-2', title: 'Phase 5.2 — Build', timeframe: 'monthly' }),
  goal('p5', 'Build', { id: 'p5-2-1', parentId: 'p5-2', timeframe: 'weekly', title: 'Source scrapers / RSS / API connectors' }),
  goal('p5', 'Build', { id: 'p5-2-2', parentId: 'p5-2', timeframe: 'weekly', title: 'Claude summarizer + relevance filter' }),
  goal('p5', 'Build', { id: 'p5-2-3', parentId: 'p5-2', timeframe: 'weekly', title: 'Telegram bot + scheduled job' }),
  goal('p5', 'Build', { id: 'p5-2-4', parentId: 'p5-2', timeframe: 'weekly', title: 'Error alerting' }),

  goal('p5', 'Iterate', { id: 'p5-3', title: 'Phase 5.3 — Iterate', timeframe: 'monthly' }),
  goal('p5', 'Iterate', { id: 'p5-3-1', parentId: 'p5-3', timeframe: 'weekly', recurrence: 'weekly', title: 'Tune relevance based on what I actually read' }),
];

// --- Goals: P6 Program Portfolio Pipeline ----------------------------------

const goalsP6: Goal[] = [
  goal('p6', 'Backlog', { id: 'p6-1', title: 'Phase 6.1 — Backlog', timeframe: 'monthly' }),
  goal('p6', 'Backlog', { id: 'p6-1-1', parentId: 'p6-1', timeframe: 'weekly', title: 'Capture 10–50 ideas, rank by impact × effort' }),
  goal('p6', 'Backlog', { id: 'p6-1-2', parentId: 'p6-1', timeframe: 'weekly', title: 'Tag each: solo-utility / sellable / portfolio-only / showcase-worthy' }),

  goal('p6', 'Shipping', { id: 'p6-2', title: 'Phase 6.2 — Shipping cadence', timeframe: 'yearly' }),
  goal('p6', 'Shipping', { id: 'p6-2-1', parentId: 'p6-2', timeframe: 'monthly', recurrence: 'monthly', title: 'Ship 1 small program end-to-end' }),
  goal('p6', 'Shipping', { id: 'p6-2-2', parentId: 'p6-2', timeframe: 'monthly', title: 'Every ship → P2 showcase post + P1 in-app test' }),
  goal('p6', 'Shipping', { id: 'p6-2-3', parentId: 'p6-2', timeframe: 'monthly', recurrence: 'monthly', title: 'Sunset programs that do not pull weight (quarterly check)' }),
];

// --- Seed notes — full readable breakdown, one per project -----------------
// User can reread + edit these in the Notes tab to adjust the roadmap.

function noteBody(lines: string[]): string {
  return lines.join('\n');
}

export const seedNotes: Note[] = [
  {
    id: 'note-p1',
    title: 'P1 — Marketing Suite App — full breakdown',
    projectId: 'p1',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2028)',
      'Ship the Marketing Suite — a one-app campaign engine.',
      'Why: replace HighLevel-class workflows for a solo operator — avatars, strategies, social posts, GSC + GA4, all in one place. Expandable from there.',
      '',
      'PHASES',
      '',
      '1.1 Competitor & feature research (monthly)',
      '- Tear down HighLevel: pricing, feature map, gaps',
      '- Tear down Jasper / Buffer / Hootsuite / Ocoya / Predis.ai',
      '- Write "what we do differently" one-pager',
      '- Lock MVP cut: must / should / later',
      '',
      '1.2 Architecture plan (monthly — finish BEFORE any code)',
      '- Domain model: Project → Campaign → Strategy → Tactic → Asset',
      '- Avatar schema (demographics, psychographics, channels, pain points, voice)',
      '- Integration list + auth model (GSC, Meta Graph, TikTok, X, GA4, Mailchimp)',
      '- Stack decision (likely Next.js + Postgres + Claude API)',
      '- Full ERD + system diagram signed off',
      '',
      '1.3 Avatar generator (yearly)',
      '- Avatar form (target market, region, age, income, behavior)',
      '- Where the avatar hangs out — digital channels (subreddits, IG creators, YouTube, Discord, podcasts)',
      '- Where the avatar hangs out — physical/offline (events, neighbourhoods, stores, meetups)',
      '- Claude enrichment: objections, language patterns, voice samples',
      '- Save / version / clone avatars per project',
      '- Avatar → campaign brief generator',
      '',
      '1.4 Strategy + tactic generator (yearly)',
      '- Strategy templates: awareness / conversion / retention / launch',
      '- Tactic decomposition from strategy',
      '- Channel mix recommendation from avatar',
      '- Campaign timeline export (Gantt)',
      '',
      '1.5 Social post generator (yearly)',
      '- Pipeline: brief → draft → human-voice → hashtags → image prompt',
      '- Anti-AI-tells filter (copy must never sound AI)',
      '- Realistic image generation (best-in-class model)',
      '- Image realism human-eval pass — 10 sample posts must look fully real before shipping',
      '- Preview popup: IG / FB / TikTok / X / LinkedIn on iPhone, Pixel, desktop frames',
      '- Inline editor for copy + image + hashtags',
      '- Schedule + publish via official APIs',
      '',
      '1.6 GSC + analytics (yearly)',
      '- OAuth GSC → queries + pages',
      '- GA4 connector',
      '- Insight cards: rising queries, decaying pages, CTR outliers',
      '',
      '1.7 Use it on morimake.com + public launch (yearly)',
      "- Run morimake.com's marketing through the app end-to-end",
    ]),
  },
  {
    id: 'note-p2',
    title: 'P2 — morimake.com Brand & Web Presence — full breakdown',
    projectId: 'p2',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2027)',
      'morimake.com reads as tier-1 tech on first contact — three signature pages + a content engine that posts daily across every channel.',
      '',
      'PHASES',
      '',
      '2.1 Three cinematic landing pages (yearly)',
      '- Mood board + reference scrape (do FIRST)',
      '- Page A — red black-hole on shifting dark-red background, video-like motion, fully cinematic',
      '- Page B — purple × green high-strike concept',
      '- Page C — third concept (define in mood board step)',
      '- Tooling shortlist: Framer / Spline / Rive / Lottie / Three.js',
      '- Evaluate AI design tools (Lovable, v0, Krea, Midjourney, Recraft, Galileo) for landing-page generation',
      '- Build A → B → C',
      '- Performance budget: LCP < 2.5s, no jank on mid-tier mobile',
      '',
      '2.2 Launch video set (monthly)',
      '- 3–6 hero videos showcasing the three sites',
      '- Vertical + horizontal cut per video',
      '- 3 thumbnail + hook variants per video',
      '- Post the hero videos on every marketing channel',
      '',
      '2.3 Social accounts setup (weekly)',
      '- Create + brand FB, IG, TikTok, X, LinkedIn, YouTube for morimake.com',
      '- Bio + link-in-bio page + pinned post on each',
      '- Tracking pixels + UTMs wired',
      '',
      '2.4 Posting engine (monthly)',
      '- Posting plan doc — pillars, cadence, channel mix (write FIRST, no posting before this)',
      '- Growth model + KPIs locked (reach / engagement / follows / link-clicks targets per channel)',
      '- Scheduled posting calendar — visible 4 weeks ahead per channel',
      '- DAILY: post on at least one channel (min 5×/week aggregate)',
      '- WEEKLY: 1 long-form video or carousel',
      '- WEEKLY: reach + engagement review, adjust pillar mix',
      '- MONTHLY: cohort retention review',
      '- Wire the P1 publisher into the live posting pipeline once v0.1 ships',
      '',
      '2.5 Program showcase posts (weekly — fed by P6)',
      '- Ship-log post template (small → big)',
      '- Video + image variant per shipped program',
      '- Cross-post automation (uses P1 Marketing Suite)',
      '',
      '2.6 Reddit auto-commenter agent (yearly)',
      '- Subreddit map + per-sub rules audit (read BEFORE building)',
      '- Compliance gate: Reddit ToS, anti-spam, ban-risk model',
      '- Agent design: Claude + Reddit API, value-first comment policy, mention cap per thread',
      '- Human-in-loop approval queue (no auto-send Day 1)',
      '- Gradual autonomy ramp + metrics (karma, reports, bans)',
      '',
      '2.7 Video creation experiments (yearly — 20–50 videos)',
      '- Pick 5 techniques: talking-head, AI-avatar, dev-log screen-record, motion graphic, doc-style',
      '- Produce 4–10 videos per technique → 20–50 total',
      '- Post + measure; double down on top 2 techniques',
    ]),
  },
  {
    id: 'note-p3',
    title: 'P3 — Business Email Outreach Engine — full breakdown',
    projectId: 'p3',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2027)',
      'Daily, repeatable outbound machine → 2–5 booked calls per week.',
      '',
      'PHASES',
      '',
      '3.1 Improve the existing program (monthly — PLAN before edits)',
      '- Audit current program: capabilities, gaps, broken bits',
      '- Improvement plan doc — scope, sequencing, definition of done',
      '- Better targeting (industry, size, intent signals)',
      '- Better personalization (Claude first-line generator)',
      '- Deliverability: SPF / DKIM / DMARC, warm-up, send caps',
      '- Reply tracking + CRM-lite',
      '',
      '3.2 Daily sending',
      '- DAILY: send 5–10 personalized emails',
      '- DAILY: log + classify replies (interested / not / bounce)',
      '- WEEKLY: A/B test subject + opener',
      '- MONTHLY: funnel review, kill dead segments',
    ]),
  },
  {
    id: 'note-p4',
    title: 'P4 — Learning Track — full breakdown',
    projectId: 'p4',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2027)',
      'Operate at a senior level across marketing, sales, communication, and applied AI. Skill is the lubricant for every other project — never let it go quiet for more than a week.',
      '',
      'PHASES',
      '',
      '4.1 Marketing fundamentals (yearly)',
      '- Read: Breakthrough Advertising',
      '- Read: Building a StoryBrand',
      '- Read: Hooked',
      '- Read: $100M Offers',
      '- WEEKLY: 1 chapter + 1-page synthesis applied to morimake',
      '',
      '4.2 Sales (yearly)',
      '- Read: SPIN Selling',
      '- Read: Never Split the Difference',
      '- Read: Way of the Wolf',
      '- WEEKLY: 1 cold call or live pitch role-play',
      '',
      '4.3 Communication & writing (yearly)',
      '- Read: On Writing Well',
      '- Read: Ogilvy on Advertising',
      '- Read: Adweek Copywriting Handbook',
      '- DAILY: 200-word writing rep (post, email, or doc)',
      '',
      '4.4 AI control & engineering (yearly)',
      '- Anthropic + OpenAI docs end-to-end',
      '- Agent frameworks: Claude Agent SDK, LangGraph, OpenAI Agents',
      '- RAG + evals + tool use mastered before scaling agents',
      '- MONTHLY: ship 1 agent tied to a real business need',
    ]),
  },
  {
    id: 'note-p5',
    title: 'P5 — News Telegram Bot — full breakdown',
    projectId: 'p5',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2027)',
      'A reliable morning topic digest delivered to my phone via Telegram bot at a scheduled time.',
      '',
      'PHASES',
      '',
      '5.1 Spec (monthly)',
      '- Topics, sources, dedup, delivery time, format',
      '',
      '5.2 Build (monthly)',
      '- Source scrapers / RSS / API connectors',
      '- Claude summarizer + relevance filter',
      '- Telegram bot + scheduled job',
      '- Error alerting',
      '',
      '5.3 Iterate',
      '- WEEKLY: tune relevance based on what I actually read',
    ]),
  },
  {
    id: 'note-p6',
    title: 'P6 — Program Portfolio — full breakdown',
    projectId: 'p6',
    createdAt: NOW,
    updatedAt: NOW,
    body: noteBody([
      'VISION (2028)',
      'Ship + showcase 10–50 small-to-medium programs over 2 years. Every shipped program feeds the morimake content engine and proves the brand can build.',
      '',
      'PHASES',
      '',
      '6.1 Backlog (monthly)',
      '- Capture 10–50 ideas, rank by impact × effort',
      '- Tag each: solo-utility / sellable / portfolio-only / showcase-worthy',
      '',
      '6.2 Shipping cadence (yearly)',
      '- MONTHLY: ship 1 small program end-to-end',
      '- Every ship → P2 showcase post + P1 in-app test',
      '- QUARTERLY: sunset programs that do not pull weight',
    ]),
  },
];

// --- Exports ---------------------------------------------------------------

export const seedSets: GoalSet[] = [];

export const seedGoals: Goal[] = [
  ...goalsP1,
  ...goalsP2,
  ...goalsP3,
  ...goalsP4,
  ...goalsP5,
  ...goalsP6,
];

export const seedProfile: Profile = {
  name: '',
  xp: 0,
  streakDays: 0,
  bestStreak: 0,
  lastActiveDate: undefined,
  freezeTokens: 0,
  stats: { daily: 0, weekly: 0, monthly: 0, yearly: 0, missed: 0 },
};
