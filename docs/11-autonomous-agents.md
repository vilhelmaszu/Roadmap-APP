# 11 — Autonomous Agents (a primer)

## What an agent is

At its simplest, an **autonomous agent** is:

> A loop that gives an LLM access to tools, lets it call those tools to
> change the world, observes the result, and repeats — until the goal is
> reached or you stop it.

That's it. No magic. The "intelligence" is in the model (Claude, GPT-4,
etc). The "autonomy" is in the loop — it keeps going on its own without
you prompting each step.

### The classic loop

```
┌─────────────────────────────────────────┐
│ 1. Model gets the goal + current state  │
│ 2. Model decides: what tool to call?    │
│ 3. Tool runs (could be a real action!)  │
│ 4. Tool result returned to model        │
│ 5. Model decides: am I done? If not...  │
│    Back to step 2                       │
└─────────────────────────────────────────┘
```

Concrete example — "write me a daily news digest about marketing trends":

```
Iter 1: Model calls web_search("marketing trends June 2026")
        → gets 10 article titles + URLs
Iter 2: Model calls fetch_url(url1)
        → gets full article text
Iter 3: Model calls fetch_url(url2)
        → gets full article text
...
Iter 7: Model calls send_telegram("Today's digest: <summary>")
        → message posted to your phone
Iter 8: Model decides: done. Loop exits.
```

You ran it once. It made 8 decisions. You got a digest. That's the agent.

## What people use them for

- **Research** — gather + summarize information from many sources (your P5 news bot)
- **Outbound** — send personalized emails, comments, messages at scale (your Reddit bot, email sender)
- **Monitoring** — watch a metric, alert you when something happens
- **Content creation** — draft posts, images, videos (your P1 Marketing Suite social-post generator)
- **Operations** — keep a system running: deploy code, restart broken services, scale infrastructure
- **Conversational** — answer questions about your data via natural language (an agent that knows your goals + can give you a status report)

The Claude apps you talk to are agents. So is GitHub Copilot. So is
Cursor. So is the thing that wrote this doc.

## Where they "live" — three hosting models

The agent needs to run somewhere with a network connection, money in an
API account, and persistent storage. The choice depends on how often it
runs and how much oversight you want.

### Model A: On your laptop / PC

The simplest. You run a script in your terminal:

```bash
python news_agent.py
```

It runs. It uses your API key. You read the output. You stop it.

**Good for**: prototyping, one-shot tasks, anything you want to babysit.
**Bad for**: anything that needs to run when your laptop is closed.

### Model B: Scheduled in the cloud (cron-style)

The agent script lives on a free cloud platform (Cloudflare Workers,
GitHub Actions, AWS Lambda, Vercel Cron). A schedule triggers it.

Example: GitHub Actions cron-yaml that runs your daily-email agent every
morning at 9am.

```yaml
name: Daily outbound emails
on:
  schedule:
    - cron: '0 9 * * *'   # 9am every day
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install anthropic
      - run: python send_emails.py
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Good for**: recurring tasks (daily news digest, weekly cohort review).
**Bad for**: long-running tasks (some platforms have a 5–15 min max).

### Model C: Always-on (a persistent process)

For agents that need to react to events in real time (a Reddit bot watching
new posts, a Slack agent answering questions). Hosts: Railway, Fly.io,
Render, a VPS like Hetzner.

**Good for**: 24/7 monitoring, conversational bots, anything event-driven.
**Bad for**: cost (~$5–20/month for a tiny always-on instance) and the
chance of silent failure if you don't monitor it.

## Connecting agents to YOUR systems

An agent is just code. The "tools" it calls are functions you write.
Examples wired to your morimake stack:

- **Read your roadmap**: a `get_my_goals()` tool that queries the Supabase
  `goals` table using a service-role key (server-side, RLS-bypassed)
- **Update progress**: a `mark_goal_done(goal_id)` tool that calls
  Supabase to toggle a row
- **Send messages**: a `send_telegram(message)` tool that hits the
  Telegram Bot API
- **Post to socials**: a `post_to_instagram(text, image_url)` tool that
  uses Meta's Graph API

The model only knows about the tools you give it. You define which
tools exist. The model decides when to call them.

## The Claude Agent SDK (what we'd actually use)

Anthropic's Claude Agent SDK gives you the loop for free. You write the
tools as TypeScript or Python functions and the SDK handles:

- Sending the conversation to the API
- Parsing the model's tool calls
- Executing the tools
- Sending the results back
- Looping until the model says "done"

Pseudo-code shape:

```ts
import Anthropic from '@anthropic-ai/sdk';
import { runAgent } from '@anthropic-ai/agent-sdk';

await runAgent({
  client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  model: 'claude-sonnet-4-5',
  systemPrompt: 'You are an outbound sales agent. Find 10 marketing agencies in Vilnius and draft personalized cold emails to each.',
  tools: [
    {
      name: 'search_businesses',
      description: 'Find businesses matching criteria in a region',
      input_schema: { /* ... */ },
      handler: async ({ industry, region }) => searchGooglePlaces(industry, region),
    },
    {
      name: 'draft_email',
      description: 'Draft a personalized cold email',
      input_schema: { /* ... */ },
      handler: async ({ business_name, opener_hook }) => `Hi ${business_name}, ...`,
    },
    {
      name: 'save_to_outbox',
      description: 'Save a drafted email to my outbox for review',
      input_schema: { /* ... */ },
      handler: async ({ to, subject, body }) => writeToSheet(to, subject, body),
    },
  ],
});
```

Run that script → the model:
1. Calls `search_businesses({ industry: 'marketing', region: 'Vilnius' })`
2. Gets back 10 results
3. For each result: calls `draft_email(...)` → gets back text
4. For each draft: calls `save_to_outbox(...)`
5. Says "done, 10 emails drafted"
6. Loop exits

You wake up to 10 emails in your spreadsheet, ready to review and send.

## Costs to know about

- Claude API: ~$3–15 per million tokens depending on model. A single agent
  run that does a few research calls + drafts a doc is usually $0.01–0.10.
- Tool execution: free unless your tools hit paid APIs (Google Places, ad
  platforms, etc.)
- Hosting:
  - Laptop run: free, but only when laptop is on
  - GitHub Actions cron: free for public repos, 2000 free minutes/month for private
  - Cloudflare Workers: free up to 100k requests/day, scheduled events free up to 100/day
  - Always-on cloud: $5/month for a tiny instance

For a daily news digest agent: probably $0.50/month total (mostly Anthropic API).
For a 24/7 Reddit comment bot: $5–15/month (mostly hosting).

## Concrete agents tied to your morimake roadmap

These already exist in your seed as P2.6 / P3 / P5 — here's the agent shape
each would take:

### News Telegram Bot (P5)

- **Schedule**: every morning at 8am
- **Tools**: `web_search`, `fetch_url`, `send_telegram`
- **System prompt**: "Find 3-5 articles from the last 24h about [topics].
  Summarize each in 2 sentences. Send via Telegram."
- **Host**: GitHub Actions cron (free) or Cloudflare Workers cron
- **Effort to build**: 1-2 days

### Reddit auto-commenter (P2.6)

- **Schedule**: every 30 min (poll for new posts in target subreddits)
- **Tools**: `fetch_reddit_posts`, `draft_comment`, `queue_for_approval`
  (no auto-send initially — human-in-loop)
- **System prompt**: "Find new posts about [topics] in [subreddits].
  For each, if you can add a value-first comment that mentions morimake,
  draft it. Queue for my approval."
- **Host**: always-on cheap VPS or Cloudflare Workers cron
- **Effort to build**: 3-5 days (Reddit API + compliance + approval UI)

### Daily email outbound (P3)

- **Schedule**: every morning at 9am
- **Tools**: existing email generator program + `fetch_business_data`,
  `draft_personalized_opener`, `send_email`
- **System prompt**: "Send 5-10 personalized emails today using my
  business finder data. Log replies."
- **Host**: GitHub Actions cron
- **Effort to build**: 1-2 days (mostly wrapping the existing program)

### Social post generator (part of P1)

- **Trigger**: manual (you click "Generate post" in the Marketing Suite app)
- **Tools**: `generate_image`, `humanize_copy`, `extract_hashtags`,
  `preview_on_phone_frame`
- **System prompt**: "Given this brief, generate 3 post variants. Each
  must look fully real, sound non-AI, have 3-5 relevant hashtags."
- **Host**: the Marketing Suite app's backend (Vercel / Cloudflare Workers)
- **Effort to build**: weeks (it's a major feature, not a one-off agent)

## How to start

Pick one. The news bot is the easiest standalone — no existing systems
to integrate with, no human-in-loop, just an LLM + a couple of APIs.

When you're ready, the rough sequence:

1. Get an Anthropic API key (https://console.anthropic.com)
2. New folder, `npm init` or `pip init`
3. Install the Anthropic SDK + Agent SDK
4. Write 2-3 tools as plain functions
5. Wire up the loop with a system prompt
6. Run it on your laptop first — read the output, refine the prompt
7. Once it works, move to GitHub Actions cron for automation
8. Watch the first few runs; tweak when something goes wrong

That's the whole thing. Agents are not mystical. They're just functions
that an LLM calls until a task is done.
