# Guide interface alternatives — first-principles IA exploration

**From:** @fable, 2026-07-07. **Responding to:** `design-rethink-guide-interface.md` (@opus).
**Status:** design exploration for @adam to choose a direction. No code implied yet.

---

## The frame I used

The guide has exactly one job: **help a voter decide, calmly**. Everything else — stories, activity, freshness — is fuel for that job or a reason to come back. That gives a hard ranking: the ballot is the spine; news is context; activity is scent; "since last visit" is a lens. A design fails if a voter two weeks before the ballot deadline can't get to *their races* faster than they can get to our news.

Two distinct visitors matter:
- **The decider** (most people, arriving once or twice, close to voting): wants their races, comparisons, receipts. News matters *at the point of decision* — "why is this race weird" belongs next to the race.
- **The follower** (repeat visitor during the season, including us and the civically addicted): wants "what changed since I was here." Activity + editorial in one scannable place.

The current interface serves the decider adequately and the follower barely; the feed we just built serves the follower and *dilutes* the decider (it pushes the ballot below headlines). The tension is real and the design question is: **is news a lane, or an attribute of races?** The alternatives below are genuinely different answers to that.

One structural fact that shapes everything (from the research pass): Washington's top-two primary only lists races with 3+ filers, so the August guide is *short* (a dozen-ish races) while November's will be long (40+). The IA must feel right at both lengths.

---

## Approach A — "Woven context" (news as an attribute of races)

**Point of view:** a voter shouldn't have to leave the race to learn why it matters. Editorial stories live *inside* the race presentation; there is no editorial feed on guide pages at all.

- **Guide page** = ordered races, each rendered as a **race section** (a redesigned, denser RaceCard):
  - office title + compare/surveys links
  - a **candidate strip**: face chips + names in a wrapping row (this is how 1 and 12 candidates both work — chips wrap; full candidate cards do not). Tap a chip → candidate page. The current full-card stack simply cannot scale to 11 candidates on a guide page.
  - an **at-a-glance row**: contested/uncontested, questionnaire participation count, total raised, endorsement count.
  - **story callout(s)**: when a prominent story is placed on the race, a one-line ⚡ callout (headline, expandable blurb + citations) inside the section. The Torres story renders *with* the 8th LD race.
- **Activity rollup**: a slim collapsed digest bar at the very top of the guide ("Since your last visit: 1 new questionnaire · $84k in new donations · 12 endorsements — expand"). Expanding shows the dated rollup. This is the only feed-like surface on the guide.
- **Site-wide stories** (rare): a single pinned callout above the digest bar.
- **Desktop/mobile:** one flow. Chips wrap wider on desktop, tighter on mobile. Nothing needs a second layout.

**Optimizes for:** the decider; context exactly where the decision happens; graceful 1→12 scaling; mobile identical to desktop.
**Gives up:** an editorial "front page" feel — our reporting takes visual back seat; browsing *all* news in one place happens only on the homepage. Biggest build: the race-section redesign (the current RaceCard goes away).
**Existing pieces:** Story/StoryPlacement fit perfectly (RACE placements drive callouts). The built guide feed is demoted to activity-only. Compare/surveys pages unchanged.

## Approach B — "Two-lane guide" (news as a lane beside the ballot)

**Point of view:** desktop screens are wide and we waste them; give the ballot a main column and the season a sidebar.

- **Desktop:** main column = ordered races (current cards, lightly tightened). Right rail = "This season" lane: pinned editorial stories, then the daily activity rollup, with a "— new since your last visit —" divider. Race-tied stories in the rail get a small "in the news" badge on the corresponding race card.
- **Mobile:** the rail collapses into a single "News & activity" accordion at the top of the guide (roughly the feed we already built), badges stay on the race cards.
- **Race pages** gain a "Coverage" block (full story + citations) so badges have somewhere real to land.

**Optimizes for:** the follower and the desktop reader; strong editorial presence without displacing the ballot vertically; least rework of existing race cards.
**Gives up:** mobile is a degraded compromise (exactly today's problem, renamed); rail-to-race spatial alignment is fragile and will drift; two layout modes to maintain forever; race context still lives *beside*, not *in*, the race. And it does nothing for the 11-candidate card-stack problem — that has to be solved separately anyway.
**Existing pieces:** everything fits; the built feed becomes the mobile accordion + rail content.

## Approach C — "Hub and spokes" (news centralized, guides pure)

**Point of view:** don't make one page do two jobs. The **homepage** becomes the season hub — the full merged feed (editorial + activity, since-last-visit divider, filter by county) plus prominent "get to your ballot" entries. **Guide pages go pure ballot** (races only; at most one pinned story slot for a genuinely major item). **Race/compare pages** absorb their stories as a "Coverage" section with citations.

**Optimizes for:** clarity of purpose per page; one canonical home for news (no duplication/placement anguish); the homepage finally has a reason to exist beyond a directory; simplest mental model.
**Gives up:** serendipity — a Franklin guide browser never sees the Torres story unless it's pinned or they visit the race; the hub goes stale visibly in slow weeks (dead-site smell); more hops on mobile.
**Existing pieces:** Story model fine; homepage rework; guide feed removed; race pages gain Coverage.

## Approach D — the north star, not the next step: "Your ballot"

Nobody votes in both counties, and nobody's ballot has all 40 races. The eventual right answer is a one-time district picker (or address lookup) persisting a **personalized guide**: your races, your news, your since-last-visit. Everything in A–C remains useful as the browse-all fallback. I flag it because whichever approach we pick should not *foreclose* this (all three above are compatible), but building it now would be over-engineering for a volunteer-run guide five weeks before a primary.

---

## My recommendation: A, with C's race-page Coverage block, and B's badge idea

Concretely: **stories are attributes; activity is the only lane.**

1. Editorial stories render inside race sections (A) and in full on race/compare pages (C's Coverage block). Site-wide items pin once at the top of the guide.
2. The activity rollup + since-last-visit is a collapsed digest strip at the top of guides, and grows into the homepage's "Latest updates" (a hub-lite version of C — the homepage already wants this).
3. The race presentation on guides becomes the chip-strip + at-a-glance section from A. This is simultaneously the answer to "1–12 candidates" — the only representation that survives both extremes — and it shortens the November guide from unbounded card stacks to a scannable ballot. It's the biggest single change, and the one I'd prototype first because everything else hangs off it.

Why not B: the rail spends our complexity budget on a desktop nicety, keeps mobile as a second-class compromise, and still leaves race context beside rather than in the race. Why not pure C: point-of-decision context is the guide's differentiator; centralizing news throws that away.

## The five open questions

1. **Activity model:** separate table, emphatically — `ActivityEntry(date, type, scope/placement, payload JSON)`. It's *generated*: importers emit entries at import time (they know the delta — "wrote 4,342 rows, $3.05M" — no snapshot diffing needed), and entries must be regenerable/idempotent without churning editorial content. Render through the same feed components as stories, but never mix provenance in the data. Authored = Story; generated = ActivityEntry.
2. **Since last visit:** localStorage timestamp, client-side divider/badges over the server-rendered feed. No server-side per-visitor state — the User model is for wiki editors, most visitors are anonymous, and a nonpartisan guide should be conspicuously non-tracking. First visit defaults to "last 7 days" as the recent window. One small client component.
3. **Prominent race-tied stories:** inside the race section (compact callout, expandable), full text + citations on the race page. Inline flow degrades perfectly on mobile, which the rail alternative can't claim. Pinned-atop-guide is reserved for genuinely site/guide-wide items.
4. **Homepage:** hub-lite. Keep the directory + how-to; grow "Latest updates" into the merged feed (site-scope stories + activity digest). Don't build a command center — guides stay the primary destination and the homepage shouldn't compete with them.
5. **Desktop vs mobile:** one IA, responsive *components* — not a dual layout. Chip strips wrap wider, the digest can go two-column on desktop, story callouts stay inline everywhere. The only thing that truly demands a dual-layout IA is the rail, and I'm recommending against the rail.

## What this means for what's already built

- **Story/StoryPlacement/Citation:** keep unchanged — placements map 1:1 to where callouts render.
- **The guide feed as shipped:** becomes the activity digest (collapsed by default, activity + since-last-visit only); editorial stories move into race sections.
- **Compare picker / surveys page / whole-field board:** untouched by all approaches; they already solve the many-candidate problem at their depth. The chip-strip race section deliberately echoes the picker chips — same visual vocabulary, increasingly the site's signature interaction.
- **Paused admin authoring screen:** resume after direction is chosen; the Story model doesn't change.

## Suggested sequencing (if the recommendation is chosen)

1. Prototype the race section (chip strip + at-a-glance + story callout) on one guide with real 2026 data — this is where the design lives or dies; screenshot review with @adam before anything else.
2. Activity: `ActivityEntry` + importer emission + digest strip (collapsed) + since-last-visit divider.
3. Homepage hub-lite (grow Latest updates into the merged feed).
4. Race-page Coverage block; resume the admin screen.
