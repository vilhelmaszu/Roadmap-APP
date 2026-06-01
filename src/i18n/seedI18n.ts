// Lithuanian translations for seeded roadmap content.
//
// Goal titles, vision content, project names, and note titles/bodies are
// stored as English strings in the Zustand store (because they originate
// from `src/domain/seed.ts`). When the language toggle flips to 'lt', we
// look the English string up here and swap it at render time. If the user
// EDITS a seeded string (so it no longer matches its English seed value),
// the lookup misses and the user's edit shows verbatim in both languages.
//
// New content the user types themselves doesn't appear here — it stays in
// whatever language they typed it in.

import type { Lang } from '.';

// Keyed by the canonical English string from seed.ts.
const lt: Record<string, string> = {
  // --- Project names -------------------------------------------------------
  'Marketing Suite App': 'Rinkodaros sistemos programa',
  'morimake.com Brand': 'morimake.com prekės ženklas',
  'Email Outreach Engine': 'El. laiškų siuntimo sistema',
  'Learning Track': 'Mokymosi kelias',
  'News Telegram Bot': 'Naujienų Telegram botas',
  'Program Portfolio': 'Programų portfelis',

  // --- Vision titles + whys ------------------------------------------------
  'Ship the Marketing Suite — a one-app campaign engine':
    'Sukurti rinkodaros sistemą — vieną programą kampanijoms valdyti',
  'Replace HighLevel-class workflows for a solo operator: avatars, strategies, social posts, GSC + GA4, all in one place.':
    'Pakeisti HighLevel tipo įrankius vienam žmogui dirbančiam: avatarai, strategijos, socialinių tinklų įrašai, GSC + GA4 — viskas vienoje vietoje.',

  'morimake.com reads as tier-1 tech on first contact':
    'morimake.com nuo pirmo žvilgsnio atrodo kaip pirmos klasės technologijų prekės ženklas',
  'Three signature landing pages, a launch video set, and a content engine that posts daily across every channel.':
    'Trys išskirtiniai pristatymo puslapiai, pristatymo vaizdo įrašų rinkinys ir turinio sistema, kuri kasdien skelbia kiekviename kanale.',

  'Daily outbound machine that books 2–5 calls per week':
    'Kasdieninė pardavimų sistema, suorganizuojanti 2–5 susitikimus per savaitę',
  'Improve the existing email generator into a deliverable, personalized, measurable outbound engine — then run it daily.':
    'Patobulinti esamą el. laiškų generavimo programą iki patikimos, personalizuotos ir matuojamos sistemos — tada naudoti ją kasdien.',

  'Operate at a senior level across marketing, sales, comms, and applied AI':
    'Veikti aukšto lygio specialisto lygmenyje rinkodaroje, pardavimuose, komunikacijoje ir AI panaudojime',
  'Skill is the lubricant for every other project — never let it go quiet for more than a week.':
    'Įgūdžiai yra variklis kitiems projektams — niekada nepalikti jų be priežiūros ilgiau nei savaitę.',

  'A reliable morning topic digest delivered to my phone':
    'Patikima ryto naujienų santrauka, atsiunčiama į telefoną',
  'Small, focused agent. Telegram bot, curated topic, summary at a scheduled time.':
    'Mažas, tikslingas agentas. Telegram botas, parinkta tema, santrauka nustatytu laiku.',

  'Ship + showcase 10–50 small programs over 2 years':
    'Per 2 metus sukurti ir pristatyti 10–50 mažų programų',
  'Every shipped program feeds the morimake content engine and proves the brand can build.':
    'Kiekviena sukurta programa maitina morimake turinio sistemą ir įrodo, kad prekės ženklas geba kurti.',

  // --- Vision plan points --------------------------------------------------
  // P1
  'Competitor research complete, MVP cut locked': 'Konkurentų tyrimas baigtas, MVP apimtis užfiksuota',
  'Architecture + ERD signed off before any code': 'Architektūra + ERD patvirtinti prieš pradedant kodą',
  'Avatar generator shipped': 'Avatarų generatorius sukurtas',
  'Strategy + tactic generator shipped': 'Strategijų ir taktikų generatorius sukurtas',
  'Social post generator shipped': 'Socialinių tinklų įrašų generatorius sukurtas',
  'GSC + GA4 integrations live': 'GSC + GA4 integracijos veikia',
  "Running morimake.com's own marketing through the app": 'morimake.com rinkodara vykdoma per pačią programą',
  // P2
  'Three cinematic landing pages live': 'Trys kinematografiniai pristatymo puslapiai veikia',
  '3–6 hero launch videos shipped': '3–6 pagrindiniai pristatymo vaizdo įrašai sukurti',
  'FB / IG / TikTok / X / LinkedIn / YouTube branded and active': 'FB / IG / TikTok / X / LinkedIn / YouTube apipavidalinti ir aktyvūs',
  'Daily posting cadence sustained for 90 days': 'Kasdieninis skelbimo ritmas išlaikytas 90 dienų',
  'Reddit auto-commenter agent live with human-in-loop': 'Reddit automatinio komentavimo agentas veikia su žmogaus patvirtinimu',
  '20–50 video experiments produced, top 2 techniques identified': '20–50 vaizdo įrašų eksperimentų sukurti, geriausios 2 technikos atrinktos',
  // P3
  'Existing program audited, improvement plan written': 'Esama programa peržiūrėta, tobulinimo planas parašytas',
  'Deliverability hardened (SPF / DKIM / DMARC, warm-up)': 'Pristatymas užtikrintas (SPF / DKIM / DMARC, šildymas)',
  'Per-lead personalization via Claude first-line': 'Kiekvieno gavėjo personalizacija per Claude pirmąją eilutę',
  'Reply tracking + CRM-lite shipped': 'Atsakymų sekimas + paprastas CRM sukurtas',
  '1,500+ emails sent in Year 1': '1500+ laiškų išsiųsta per pirmus metus',
  // P4
  'Marketing canon read + applied to morimake': 'Rinkodaros klasika perskaityta ir pritaikyta morimake',
  'Sales canon read + 50+ live pitch reps': 'Pardavimų klasika perskaityta + 50+ gyvų pristatymų',
  'Daily writing rep sustained': 'Kasdieninė rašymo praktika išlaikoma',
  'Anthropic + OpenAI docs end-to-end': 'Anthropic + OpenAI dokumentacija perskaityta iki galo',
  'One agent shipped per month against a real business need': 'Vienas agentas sukurtas per mėnesį realiam verslo poreikiui',
  // P5
  'Spec locked (topics, sources, format, delivery time)': 'Specifikacija užfiksuota (temos, šaltiniai, formatas, pristatymo laikas)',
  'Build complete (scrapers → summarizer → bot → scheduler)': 'Kūrimas baigtas (rinkėjai → santraukos → botas → planuoklis)',
  'Running daily for 30 days uninterrupted': 'Veikia kasdien 30 dienų be pertraukos',
  // P6
  'Backlog of 10–50 ideas captured and ranked': '10–50 idėjų sąrašas užrašytas ir surikiuotas',
  'Monthly cadence: 1 small program shipped end-to-end': 'Mėnesinis ritmas: 1 maža programa sukurta nuo pradžios iki pabaigos',
  'Every ship triggers a showcase post + an in-app test': 'Kiekvienas sukūrimas paleidžia pristatymo įrašą + naudojimą programoje',
  'Quarterly sunset of programs that do not pull weight': 'Kas ketvirtį pašalinamos programos, kurios neneša naudos',

  // --- P1 Goals ------------------------------------------------------------
  'Phase 1.1 — Competitor & feature research': '1.1 etapas — Konkurentų ir funkcijų tyrimas',
  'Tear down HighLevel: pricing, feature map, gaps': 'Išanalizuoti HighLevel: kainos, funkcijos, spragos',
  'Tear down Jasper / Buffer / Hootsuite / Ocoya / Predis.ai': 'Išanalizuoti Jasper / Buffer / Hootsuite / Ocoya / Predis.ai',
  'Write "what we do differently" one-pager': 'Parašyti vieno puslapio dokumentą „kuo mes skiriamės"',
  'Lock MVP cut: must / should / later': 'Užfiksuoti MVP apimtį: būtina / pageidautina / vėliau',

  'Phase 1.2 — Architecture plan (finish BEFORE any code)': '1.2 etapas — Architektūros planas (užbaigti PRIEŠ pradedant kodą)',
  'Domain model: Project → Campaign → Strategy → Tactic → Asset': 'Duomenų modelis: Projektas → Kampanija → Strategija → Taktika → Turinys',
  'Avatar schema (demographics, psychographics, channels, pain points, voice)': 'Avataro schema (demografija, psichografija, kanalai, skausmo taškai, balsas)',
  'Integration list + auth model (GSC, Meta Graph, TikTok, X, GA4, Mailchimp)': 'Integracijų sąrašas + autentifikacijos modelis (GSC, Meta Graph, TikTok, X, GA4, Mailchimp)',
  'Stack decision (likely Next.js + Postgres + Claude API)': 'Technologijų pasirinkimas (greičiausiai Next.js + Postgres + Claude API)',
  'Full ERD + system diagram signed off': 'Pilna ERD + sistemos diagrama patvirtinta',

  'Phase 1.3 — Avatar generator module': '1.3 etapas — Avatarų generavimo modulis',
  'Avatar form: target market, region, age, income, behavior': 'Avataro forma: tikslinė rinka, regionas, amžius, pajamos, elgesys',
  'Where the avatar hangs out — digital channels (subreddits, IG creators, YouTube, Discord, podcasts)':
    'Kur avataras leidžia laiką — skaitmeniniai kanalai (subreddits, IG kūrėjai, YouTube, Discord, podcastai)',
  'Where the avatar hangs out — physical/offline (events, neighbourhoods, stores, meetups)':
    'Kur avataras leidžia laiką — fizinės vietos (renginiai, rajonai, parduotuvės, susitikimai)',
  'Claude enrichment: objections, language patterns, voice samples': 'Claude papildymas: prieštaravimai, kalbėjimo modeliai, balso pavyzdžiai',
  'Save / version / clone avatars per project': 'Išsaugoti / versijuoti / kopijuoti avatarus pagal projektą',
  'Avatar → campaign brief generator': 'Avataras → kampanijos užduoties generatorius',

  'Phase 1.4 — Strategy + tactic generator': '1.4 etapas — Strategijų ir taktikų generatorius',
  'Strategy templates: awareness / conversion / retention / launch': 'Strategijų šablonai: pažintis / konversija / išlaikymas / paleidimas',
  'Tactic decomposition from strategy': 'Taktikų išskirstymas iš strategijos',
  'Channel mix recommendation from avatar': 'Kanalų derinio rekomendacija pagal avatarą',
  'Campaign timeline export (Gantt)': 'Kampanijos grafiko eksportas (Gantt)',

  'Phase 1.5 — Social post generator': '1.5 etapas — Socialinių tinklų įrašų generatorius',
  'Pipeline: brief → draft → human-voice → hashtags → image prompt': 'Eiga: užduotis → juodraštis → žmogiškas balsas → grotažymės → paveikslo užklausa',
  'Anti-AI-tells filter (so the copy never sounds AI)': 'Filtras prieš AI požymius (kad tekstas niekada neatrodytų kaip AI)',
  'Realistic image generation (best-in-class model)': 'Realistiškas paveikslų generavimas (geriausios klasės modelis)',
  'Image realism human-eval pass — 10 sample posts must look fully real before shipping':
    'Realizmo patikra žmogaus akimi — 10 pavyzdinių įrašų turi atrodyti visiškai tikri prieš paleidimą',
  'Preview popup: IG / FB / TikTok / X / LinkedIn on iPhone, Pixel, desktop frames':
    'Peržiūros langas: IG / FB / TikTok / X / LinkedIn ant iPhone, Pixel ir kompiuterio rėmų',
  'Inline editor for copy + image + hashtags': 'Vietinis redaktorius tekstui + paveikslui + grotažymėms',
  'Schedule + publish via official APIs': 'Planavimas + skelbimas per oficialias API',

  'Phase 1.6 — GSC + analytics': '1.6 etapas — GSC + analitika',
  'OAuth GSC → queries + pages': 'OAuth GSC → užklausos + puslapiai',
  'GA4 connector': 'GA4 jungtis',
  'Insight cards: rising queries, decaying pages, CTR outliers': 'Įžvalgų kortelės: kylančios užklausos, krintantys puslapiai, CTR išskirtys',

  'Phase 1.7 — Use it on morimake.com + public launch': '1.7 etapas — Naudoti ją morimake.com + viešas paleidimas',
  "Run morimake.com's marketing through the app end-to-end": 'Vykdyti morimake.com rinkodarą per programą nuo pradžios iki pabaigos',

  // --- P2 Goals ------------------------------------------------------------
  'Phase 2.1 — Three cinematic landing pages': '2.1 etapas — Trys kinematografiniai pristatymo puslapiai',
  'Mood board + reference scrape (do FIRST)': 'Nuotaikos lenta + nuorodų rinkimas (atlikti PIRMIAUSIA)',
  'Page A — red black-hole on shifting dark-red, video-like motion': 'A puslapis — raudona juodoji skylė ant judančio tamsiai raudono fono, kaip vaizdo įrašas',
  'Page B — purple × green high-strike concept': 'B puslapis — violetinė × žalia ryški koncepcija',
  'Page C — third concept (define in mood board step)': 'C puslapis — trečia koncepcija (apibrėžti nuotaikos lentos etape)',
  'Tooling shortlist: Framer / Spline / Rive / Lottie / Three.js': 'Įrankių sąrašas: Framer / Spline / Rive / Lottie / Three.js',
  'Evaluate AI design tools (Lovable, v0, Krea, Midjourney, Recraft, Galileo) for landing-page generation':
    'Įvertinti AI dizaino įrankius (Lovable, v0, Krea, Midjourney, Recraft, Galileo) pristatymo puslapių generavimui',
  'Build A → B → C': 'Sukurti A → B → C',
  'Performance budget: LCP < 2.5s, no jank on mid-tier mobile': 'Greičio biudžetas: LCP < 2.5s, jokio mikčiojimo vidutinės klasės telefone',

  'Phase 2.2 — Launch video set': '2.2 etapas — Pristatymo vaizdo įrašų rinkinys',
  '3–6 hero videos showcasing the three sites': '3–6 pagrindiniai vaizdo įrašai pristatantys tris puslapius',
  'Vertical + horizontal cut per video': 'Vertikalus + horizontalus variantas kiekvienam vaizdo įrašui',
  '3 thumbnail + hook variants per video': '3 miniatiūros + įvado variantai kiekvienam vaizdo įrašui',
  'Post the hero videos on every marketing channel': 'Paskelbti pagrindinius vaizdo įrašus visuose rinkodaros kanaluose',

  'Phase 2.3 — Social accounts setup': '2.3 etapas — Socialinių tinklų paskyrų sukūrimas',
  'Create + brand FB, IG, TikTok, X, LinkedIn, YouTube for morimake.com': 'Sukurti + apipavidalinti FB, IG, TikTok, X, LinkedIn, YouTube morimake.com',
  'Bio + link-in-bio page + pinned post on each': 'Aprašymas + link-in-bio puslapis + prisegtas įrašas kiekvienoje',
  'Tracking pixels + UTMs wired': 'Sekimo pikseliai + UTM parametrai sujungti',

  'Phase 2.4 — Posting engine': '2.4 etapas — Skelbimo sistema',
  'Posting plan doc — pillars, cadence, channel mix (write FIRST, no posting before this)':
    'Skelbimo plano dokumentas — temos, ritmas, kanalų derinys (parašyti PIRMIAUSIA, nieko neskelbti iki tol)',
  'Growth model + KPIs locked (reach / engagement / follows / link-clicks targets per channel)':
    'Augimo modelis + KPI užfiksuoti (pasiekimo / įsitraukimo / sekėjų / paspaudimų tikslai kiekvienam kanalui)',
  'Scheduled posting calendar — visible 4 weeks ahead per channel': 'Suplanuotų įrašų kalendorius — matomas 4 savaitėms į priekį kiekvienam kanalui',
  'Post on at least one channel (min 5×/week aggregate)': 'Paskelbti bent viename kanale (min 5 kartus per savaitę bendrai)',
  '1 long-form video or carousel': '1 ilgesnis vaizdo įrašas arba karuselė',
  'Reach + engagement review, adjust pillar mix': 'Pasiekimo + įsitraukimo peržiūra, koreguoti temų derinį',
  'Cohort retention review': 'Kohortų išlaikymo peržiūra',
  'Wire the P1 publisher into the live posting pipeline (when v0.1 ships)':
    'Įjungti P1 skelbėją į veikiantį skelbimo srautą (kai v0.1 bus paleista)',

  'Phase 2.5 — Program showcase posts (fed by P6)': '2.5 etapas — Programų pristatymo įrašai (maitinami P6)',
  'Ship-log post template (small → big)': 'Sukūrimo dienoraščio įrašo šablonas (nuo mažo iki didelio)',
  'Video + image variant per shipped program': 'Vaizdo + paveikslo variantas kiekvienai sukurtai programai',
  'Cross-post automation (uses P1 Marketing Suite)': 'Kryžminio skelbimo automatizavimas (naudoja P1 rinkodaros sistemą)',

  'Phase 2.6 — Reddit auto-commenter agent': '2.6 etapas — Reddit automatinio komentavimo agentas',
  'Subreddit map + per-sub rules audit (read BEFORE building)': 'Subredditų žemėlapis + kiekvieno subo taisyklių peržiūra (perskaityti PRIEŠ kuriant)',
  'Compliance gate: Reddit ToS, anti-spam, ban-risk model': 'Atitikties patikra: Reddit taisyklės, prieš-spam, draudimo rizikos modelis',
  'Agent design: Claude + Reddit API, value-first comment policy, mention cap per thread':
    'Agento dizainas: Claude + Reddit API, vertės-pirmiausia komentavimo taisyklė, paminėjimų riba viename pokalbyje',
  'Human-in-loop approval queue (no auto-send Day 1)': 'Žmogaus patvirtinimo eilė (jokio automatinio siuntimo pirmą dieną)',
  'Gradual autonomy ramp + metrics (karma, reports, bans)': 'Laipsniškas savarankiškumo didinimas + metrikos (karma, pranešimai, draudimai)',

  'Phase 2.7 — Video creation experiments (20–50 videos)': '2.7 etapas — Vaizdo įrašų kūrimo eksperimentai (20–50 vaizdo įrašų)',
  'Pick 5 techniques: talking-head, AI-avatar, dev-log screen-rec, motion graphic, doc-style':
    'Pasirinkti 5 technikas: kalbanti galva, AI avataras, kūrimo dienoraščio ekrano įrašas, judesio grafika, dokumentinis stilius',
  'Produce 4–10 videos per technique → 20–50 total': 'Sukurti 4–10 vaizdo įrašų kiekvienai technikai → 20–50 iš viso',
  'Post + measure; double down on top 2 techniques': 'Paskelbti + matuoti; investuoti į geriausias 2 technikas',

  // --- P3 Goals ------------------------------------------------------------
  'Phase 3.1 — Improve the existing program (PLAN before edits)': '3.1 etapas — Patobulinti esamą programą (PLANAS prieš keitimus)',
  'Audit current program: capabilities, gaps, broken bits': 'Peržiūrėti dabartinę programą: galimybės, spragos, sugedusios vietos',
  'Improvement plan doc — scope, sequencing, definition of done': 'Tobulinimo plano dokumentas — apimtis, eiliškumas, užbaigimo apibrėžimas',
  'Better targeting (industry, size, intent signals)': 'Geresnis taikymas (pramonė, dydis, ketinimų signalai)',
  'Better personalization (Claude first-line generator)': 'Geresnė personalizacija (Claude pirmosios eilutės generatorius)',
  'Deliverability: SPF / DKIM / DMARC, warm-up, send caps': 'Pristatymas: SPF / DKIM / DMARC, šildymas, siuntimo ribos',
  'Reply tracking + CRM-lite': 'Atsakymų sekimas + paprastas CRM',

  'Phase 3.2 — Daily sending': '3.2 etapas — Kasdieninis siuntimas',
  'Send 5–10 personalized emails': 'Išsiųsti 5–10 personalizuotų laiškų',
  'Log + classify replies (interested / not / bounce)': 'Užfiksuoti + suklasifikuoti atsakymus (suinteresuotas / ne / atmetimas)',
  'A/B test subject + opener': 'A/B testuoti antraštę + pradžią',
  'Funnel review, kill dead segments': 'Piltuvėlio peržiūra, atsisakyti negyvų segmentų',

  // --- P4 Goals ------------------------------------------------------------
  'Phase 4.1 — Marketing fundamentals': '4.1 etapas — Rinkodaros pagrindai',
  'Read: Breakthrough Advertising': 'Perskaityti: Breakthrough Advertising',
  'Read: Building a StoryBrand': 'Perskaityti: Building a StoryBrand',
  'Read: Hooked': 'Perskaityti: Hooked',
  'Read: $100M Offers': 'Perskaityti: $100M Offers',
  '1 chapter + 1-page synthesis applied to morimake': '1 skyrius + 1 puslapio santrauka pritaikyta morimake',

  'Phase 4.2 — Sales': '4.2 etapas — Pardavimai',
  'Read: SPIN Selling': 'Perskaityti: SPIN Selling',
  'Read: Never Split the Difference': 'Perskaityti: Never Split the Difference',
  'Read: Way of the Wolf': 'Perskaityti: Way of the Wolf',
  '1 cold call or live pitch role-play': '1 šaltas skambutis arba gyvas pristatymas',

  'Phase 4.3 — Communication & writing': '4.3 etapas — Komunikacija ir rašymas',
  'Read: On Writing Well': 'Perskaityti: On Writing Well',
  'Read: Ogilvy on Advertising': 'Perskaityti: Ogilvy on Advertising',
  'Read: Adweek Copywriting Handbook': 'Perskaityti: Adweek Copywriting Handbook',
  '200-word writing rep (post, email, or doc)': '200 žodžių rašymo pratyba (įrašas, laiškas arba dokumentas)',

  'Phase 4.4 — AI control & engineering': '4.4 etapas — AI valdymas ir inžinerija',
  'Agent frameworks: Claude Agent SDK, LangGraph, OpenAI Agents': 'Agentų karkasai: Claude Agent SDK, LangGraph, OpenAI Agents',
  'RAG + evals + tool use mastered before scaling agents': 'RAG + vertinimai + įrankių naudojimas išmokti prieš plečiant agentus',
  'Ship 1 agent tied to a real business need': 'Sukurti 1 agentą susijusį su realiu verslo poreikiu',

  // --- P5 Goals ------------------------------------------------------------
  'Phase 5.1 — Spec': '5.1 etapas — Specifikacija',
  'Topics, sources, dedup, delivery time, format': 'Temos, šaltiniai, dublikatų šalinimas, pristatymo laikas, formatas',

  'Phase 5.2 — Build': '5.2 etapas — Kūrimas',
  'Source scrapers / RSS / API connectors': 'Šaltinių rinkėjai / RSS / API jungtys',
  'Claude summarizer + relevance filter': 'Claude santraukos + svarbos filtras',
  'Telegram bot + scheduled job': 'Telegram botas + suplanuota užduotis',
  'Error alerting': 'Klaidų pranešimai',

  'Phase 5.3 — Iterate': '5.3 etapas — Tobulinimas',
  'Tune relevance based on what I actually read': 'Koreguoti svarbą pagal tai, ką iš tikrųjų skaitau',

  // --- P6 Goals ------------------------------------------------------------
  'Phase 6.1 — Backlog': '6.1 etapas — Idėjų sąrašas',
  'Capture 10–50 ideas, rank by impact × effort': 'Surinkti 10–50 idėjų, surikiuoti pagal poveikį × pastangas',
  'Tag each: solo-utility / sellable / portfolio-only / showcase-worthy':
    'Pažymėti kiekvieną: vidiniam naudojimui / parduodama / tik portfeliui / vertinga pristatymui',

  'Phase 6.2 — Shipping cadence': '6.2 etapas — Sukūrimo ritmas',
  'Ship 1 small program end-to-end': 'Sukurti 1 mažą programą nuo pradžios iki pabaigos',
  'Every ship → P2 showcase post + P1 in-app test': 'Kiekvienas sukūrimas → P2 pristatymo įrašas + P1 panaudojimas programoje',
  'Sunset programs that do not pull weight (quarterly check)': 'Pašalinti programas, kurios neneša naudos (kas ketvirtį peržiūra)',

  // --- Note titles ---------------------------------------------------------
  'P1 — Marketing Suite App — full breakdown': 'P1 — Rinkodaros sistemos programa — pilnas išskaidymas',
  'P2 — morimake.com Brand & Web Presence — full breakdown': 'P2 — morimake.com prekės ženklas ir interneto buvimas — pilnas išskaidymas',
  'P3 — Business Email Outreach Engine — full breakdown': 'P3 — Verslo el. laiškų siuntimo sistema — pilnas išskaidymas',
  'P4 — Learning Track — full breakdown': 'P4 — Mokymosi kelias — pilnas išskaidymas',
  'P5 — News Telegram Bot — full breakdown': 'P5 — Naujienų Telegram botas — pilnas išskaidymas',
  'P6 — Program Portfolio — full breakdown': 'P6 — Programų portfelis — pilnas išskaidymas',
};

// Lookup: returns the LT version if a translation exists, else the original.
// Multi-line strings (note bodies) get a line-by-line translation pass.
export function tSeed(s: string | undefined, lang: Lang): string {
  if (!s) return s ?? '';
  if (lang !== 'lt') return s;
  if (lt[s]) return lt[s];
  // Multi-line content (note bodies): translate any matching line; leave the
  // rest as English. User edits still display verbatim.
  if (s.includes('\n')) {
    return s
      .split('\n')
      .map((line) => {
        const trimmed = line.replace(/^- /, '');
        if (lt[trimmed]) return line.startsWith('- ') ? `- ${lt[trimmed]}` : lt[trimmed];
        return line;
      })
      .join('\n');
  }
  return s;
}
