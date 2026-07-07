# FORAGE — Known Decisions & Deviations

Tracks places where the shipped code intentionally diverges from 
forage_master_spec_v6.md, or other decisions worth remembering.

## Active Outing — Transport Row
Shows only the real connector mode/time, not all three (walk/drive/transit) 
as specced. Two of three modes had no real data, so we suppress fabricated 
estimates rather than show placeholder times. Revisit when multi-modal 
transport data exists.

## Outing Preview — Caption/Name Edit State
The isEditingName and isEditingCaption flags must be explicitly reset to 
false everywhere editMode is set to false (handleBack clean exit, 
handleDiscard, handleGenerate). Missing this reset in any one path causes 
the name or caption field to reopen in edit state the next time edit mode 
is entered. Fixed 2026-07-05 — if this resurfaces, check for a new exit 
path that was added without the reset.

## Outing Preview — Fabricated Transport Time on Manual Add
handleAddPlace hardcodes a "10 min walk" connector estimate for any 
manually added stop, since no real distance data exists between all 30 
curated places. This is the same category of fabricated-data problem 
flagged and rejected on the active-outing transport row — inconsistent 
with that decision, not yet resolved here. Revisit alongside the 
transport-row fix, or replace with an honest "distance unknown" state, 
once real place-to-place data exists.

## Known Issue — app-tabs.web.tsx type error
Pre-existing tsc error: TabTrigger href="/explore" fails type-check because 
no app/explore.tsx route exists yet (Explore tab not yet built). Unrelated 
to active screens (home, outing-preview, active-outing). Will likely 
resolve on its own once Explore tab is built; if app-tabs.web.tsx turns out 
to be dead scaffold code, delete it instead of fixing the route.

## Venue Data Model — Consolidated 2026-07-06
ForYouPlace (app/index.tsx) and CuratedPlace (app/outing-preview.tsx) were 
two separately-typed, partially-duplicated venue shapes. Merged into a 
single Venue type + VENUES array in data/venues.ts, deduplicating overlaps 
(Slipstream Coffee, Rock Creek Park, Flash Nightclub existed in both) and 
preserving venues that only existed in one list (The Dabney, Hirshhorn 
Museum). Category color constants (C) also extracted from app/index.tsx 
into data/colors.ts to avoid a circular import and stop duplicating hex 
values across files. app/index.tsx, app/outing-preview.tsx, and 
app/swap-stop.tsx all now import from data/.

## Venue Catalog — Only 14 of 30 Places Built
data/venues.ts currently holds 14 places. Spec calls for 30 across 7 
categories. Experiences category has zero entries. Suggestion engine, 
FAB-flow category filtering, and swap/add flows will all under-deliver 
until the remaining ~16 places are added. Not a blocker for prototype 
demo scope, but Scout's plans will look thin/repetitive in category-heavy 
scenarios (e.g. an all-Experiences request) until this is closed.

## Stop List Place Name Font — Not Changed
Considered switching stop list place names (Scout card, Outing Preview) 
from Plus Jakarta Sans 500/15px to Libre Baskerville 700, to match the 
For You card place name font. Rejected: the stop list already carries 
category color bar + icon + category label + neighborhood + divider per 
row; adding Baskerville's heavier, wider glyphs to every row competes with 
that density rather than complementing it, and increases truncation risk 
on long real venue names. If revisited, try Jakarta Sans 600 (weight bump, 
same family) before reaching for a font-family change.

## Build Around Saved Places — Single-Seed Entry Point Deferred
Considered letting a For You card tap offer "build a plan around this 
place," reusing the existing Build Around Saved Places engine with a 
single seed instead of 3+ hearted places. Rejected for now: there is no 
engine. BuildAroundCard (app/index.tsx) is presentational only, has no 
onPress, and SAVED_PLACE_COUNT is a hardcoded constant, not derived from 
real saved-places state. Building the single-seed version means building 
real saved-places tracking + a proximity-aware plan-generation function 
from scratch — not a reuse of existing logic. Deferred past prototype. 
When built, must include distance/neighborhood awareness so a single seed 
in Georgetown doesn't pull recommendations from across the city.

## Place Detail (For You tap-through) — "More Like This" Deferred
Considered a "more like this" section on the place detail screen opened 
from a For You card tap. Deferred: requires a similarity rule (category? 
neighborhood? price?) that hasn't been designed. Don't build until that 
matching logic is specified — a shipped "more like this" with undefined 
similarity logic will look broken even if the UI is correct.

## FAB Outing Creation Flow — Question Set Locked 2026-07-06
The FAB flow is distinct from onboarding: onboarding sets overall taste 
profile once; this flow asks in-the-moment questions since preferences 
change daily. Kept to one screen, single-tap inputs only, no free text:
- People count: Solo / Date / Group (see note below on Group's meaning)
- Budget (reuses existing priceTier values)
- Duration (reuses existing 4/3/2/1 stop-count-by-time-window engine — 
  do not build a second duration→stop-count mapping)
- Vibe (single set of chips — see "Vibe/Energy merged" below)
- Category interests (multi-select from the 7 categories)
- Occasion (optional, single row, skippable — "just because / date / 
  celebrating / trying something new")

Cut, deliberately, not just simplified:
- Distance radius slider — wrong pattern for a 30-venue curated catalog; 
  implies a search-database mental model the product explicitly isn't.
- Separate "energy" question — redundant with vibe; one axis, one 
  question, not two near-duplicate ones.
- "What to include" chips (good food, scenic, live music, etc.) — 
  duplicates category interests and/or the per-stop swap/remove already 
  in Outing Preview's Edit Mode. Don't build the same capability twice.
- "Anything to avoid" (negative filtering) — real engine work (exclusion 
  logic) that doesn't exist anywhere in the suggestion system yet. Not a 
  checkbox-sized feature. Revisit as its own scoped feature, not a FAB 
  flow input.
- Free-text note — unstructured input the engine can't act on for v1; 
  adds typing friction before the first plan reveal, which the product's 
  own speed-to-value principle argues against.
- Multi-entry-point menu (Build with AI / Saved Places / Plan Around 
  Event) — collapses three distinct features into one confusing fork. 
  FAB opens this flow only. Build Around Saved Places stays a separate, 
  existing home-screen entry point. "Plan Around an Event" requires the 
  Events feature (Explore tab, not yet built) — don't reintroduce it here.

## FAB Flow — "Group" vs. Friends-Tab Duo Planning (Distinct Concepts)
"Group" in the FAB people-count question means: one person, answering 
alone, self-reporting they're planning for multiple people. It only 
affects pacing/stop-count assumptions for that single answer set — no new 
data model, no other people involved in the session. 

This is NOT the same as Duo/Friends collaborative planning, which would 
require: two separate existing taste profiles, a reconciliation step 
between conflicting preferences (e.g. one person wants nightlife, the 
other wants a quiet cafe), and an invite/accept flow — none of which 
exist. Duo Plans remains out of scope for v1 (Friends tab). Do not let 
"Group" in the FAB flow be treated as partial progress toward Duo Plans — 
they solve different problems and Duo Plans is a materially larger 
feature (shared data model + consent flow, not just a UI option).

## Explore / Friends / Profile — Stub Screens Only for July 17 Prototype
Nav bar wiring (tap → correct screen, correct active state) is in scope 
for the prototype. Full IA for these tabs (Explore: suggested/saved/
trending/hidden gems/pre-made outings/events; Friends: list/requests/add/
duo plans; Profile: history/preferences/stats/drafts/badges/settings) is 
NOT in scope — all of it is listed as "Not Yet Specified" in the master 
spec, and building any of it now is real feature design work on tabs 
already correctly cut from v1, not free navigation wiring. Each tab gets 
one on-brand, Scout-voiced holding screen (correct fonts/colors, no 
Lorem Ipsum, one or two lines gesturing at what's coming) — not a blank 
placeholder, not a built-out sub-navigation.

## Price tier semantics across cost shapes

`priceTier` ($/$$/$$$/Free) is applied inconsistently by design, because 
venues have fundamentally different cost shapes:

- **Per-meal/per-drink venues** (Eat & Drink, Coffee & Cafés): tier reflects 
  typical per-person spend for a meal or drink.
- **Ticketed venues** (Experiences, some Arts & Culture): tier reflects 
  admission price. Note: International Spy Museum uses dynamic day-of-week 
  pricing (~$25–36) and is tagged $$$ as a fixed approximation — the actual 
  price on a given day may not match the tier exactly.
- **Markets**: tagged $ universally, regardless of what's purchasable inside, 
  since entry itself is free/optional and spend is unbounded and voluntary. 
  This means $ means something different for Eastern Market (browse for 
  free, spend nothing or $40) than it does for Ben's Chili Bowl ($ = a 
  ~$6 fixed-price item).

Not resolved: there's no user-facing distinction between these cost shapes. 
A user comparing two $ venues across categories may have different 
expectations depending on which shape it is. Acceptable for v1; would need 
a real fix (e.g. category-aware tier definitions, or a legend) if this 
becomes user-visible confusion later.

---

## generatePlan: unhandled bottom-of-fallback-ladder case

The fallback ladder (relax category first, then budget) correctly preserves 
exact category+budget matches and fills remaining slots from a widened pool 
(see fix: preserve exact category+budget matches in fallback ladder). 

Not handled: if even the fully widened pool (all VENUES matching budget, or 
all VENUES if budget also can't be satisfied) has fewer venues than 
`stopCount`, `generatePlan` will silently return a plan with fewer stops 
than the time-of-day rule promised (e.g. a 4-stop request returning 2 stops). 
No UI currently accounts for a plan with fewer stops than expected.

Not observed in testing against the current 24-venue catalog — the catalog 
is currently large enough, and Free-tier venues numerous enough, that this 
wasn't triggered by any tested input combination (including narrow-category 
+ Free-budget requests). Worth revisiting if the catalog shrinks, if a 
budget/category combination emerges that's genuinely this thin, or if 
onboarding ever allows combinations narrow enough to hit it.

## For You daily selection is session-scoped, not persistent

`getDailyForYouSelection` caches the day's picks in a module-level variable, 
checked against today's date. This prevents reshuffling on re-render/remount 
within a session, but does NOT survive a cold start — force-quitting the app 
resets the cache, and a new selection is generated on relaunch. True 
cross-session daily persistence would require AsyncStorage, which is out of 
scope per the project's existing no-persistence v1 decision. Accepted gap.

## [7/7] — Stray revert of centralized color tokens in outing-preview.tsx

During FAB-wiring work, `git status` surfaced an uncommitted, unexplained diff
in app/outing-preview.tsx that removed `import { C } from '../data/colors'`
and replaced it with a fully inlined duplicate of the color token object —
directly undoing commit bc8e28c ("extract shared Venue type and color
constants into data/"). Neither prompt run that session touched this file.
Root cause not identified. Verified data/colors.ts was untouched and correct,
reverted the file with `git checkout -- app/outing-preview.tsx`, confirmed
clean via `git status` + `npx tsc --noEmit` before proceeding. Flagging as a
pattern to watch: this was the third unexplained diff in one session. If it
recurs, treat as a tooling reliability issue, not routine cleanup.

## [7/7] — generatePlan() does not yet accept duration, people count, or occasion

The FAB question flow (app/outing-questions.tsx) intentionally asks only 3
questions — category, budget, vibe — because PlanInputs / generatePlan() in
_generate-plan.ts has no parameters for duration, people count, or occasion.
`duration` exists in the PlanInputs type but is never read in the function
body (dead parameter). People count and occasion don't exist in the type at
all. These are collected nowhere in the app currently. Deferred intentionally
to keep FAB v1 scoped to what the engine can actually act on. Revisit if/when
generatePlan() is extended to use these inputs.

## [7/7] — DECISIONS.md relocated to repo root

This file previously accumulated at `.expo/~/ForageApp/Decisions.md` — inside
the gitignored `.expo/` cache directory, under a literal `~` folder (almost
certainly the same class of tooling path bug flagged above under "Stray
revert of centralized color tokens"). Everything written there was invisible
to git and to anyone not in that exact local environment. Copied the full
history to `DECISIONS.md` at the repo root, tracked normally going forward.
The stray `.expo/~/ForageApp/Decisions.md` file was left in place, untouched.

## [7/7] — Overall outing rating: dominant-category tie-break rule

`getDominantCategory` (app/_overall-rating-prompt.tsx) picks the most
frequent category among an outing's stops; on a tie, it resolves to
whichever tied category's first stop appears earliest in the stops array
(equivalent to "use the first stop's category" for an all-distinct-category
outing, and generalizes correctly when the tie is between two categories
that both outnumber a third). Chosen because the spec's tie-break wording
("use the first stop's category") is only unambiguous for the all-distinct
case; this is the natural generalization. Revisit only if product wants a
different tie-break (e.g. category order in the master spec's fixed list).
