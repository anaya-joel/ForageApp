# FORAGE: Known Decisions and Deviations

This file tracks places where the shipped code intentionally diverges from the
project's original design specs, along with other decisions worth remembering. See "Spec Documents Referenced in This Project Are Not in This Repo" under Documentation and Process Notes for what those specs are and where they actually live.

## Data & Content

### Venue Data Model: Consolidated (2026-07-06)
`ForYouPlace` (app/index.tsx) and `CuratedPlace` (app/outing-preview.tsx) were two separately-typed, partially-duplicated venue shapes. They were merged into a single `Venue` type plus a `VENUES` array in data/venues.ts, deduplicating overlaps (Slipstream Coffee, Rock Creek Park, and Flash Nightclub existed in both) and preserving venues that only existed in one list (The Dabney, Hirshhorn Museum). Category color constants (`C`) were also extracted from app/index.tsx into data/colors.ts to avoid a circular import and stop duplicating hex values across files. app/index.tsx, app/outing-preview.tsx, and app/swap-stop.tsx all now import from data/.

### Venue Catalog: 26 of 30 Places Built
data/venues.ts currently holds 26 places. The target is 30 across 7 categories. Experiences no longer has zero entries (4 are built now). The suggestion engine, FAB-flow category filtering, and swap/add flows will still under-deliver until the remaining 4 places are added. This isn't a blocker for prototype demo scope, but Scout's plans may still look thin or repetitive in the thinnest categories (Arts & Culture and Nightlife, 3 venues each) until this is closed.

### Price Tier Semantics Across Cost Shapes
`priceTier` ($/$$/$$$/Free) is applied inconsistently by design, because venues have fundamentally different cost shapes:
- **Per-meal/per-drink venues** (Eat & Drink, Coffee & Cafés): tier reflects typical per-person spend for a meal or drink.
- **Ticketed venues** (Experiences, some Arts & Culture): tier reflects admission price. Note: International Spy Museum uses dynamic day-of-week pricing (about $25 to $36) and is tagged $$$ as a fixed approximation. The actual price on a given day may not match the tier exactly.
- **Markets**: tagged $ universally, regardless of what's purchasable inside, since entry itself is free or optional and spend is unbounded and voluntary. This means $ means something different for Eastern Market (browse for free, spend nothing or $40) than it does for Ben's Chili Bowl ($ meaning a roughly $6 fixed-price item).

Not resolved: there's no user-facing distinction between these cost shapes. A user comparing two $ venues across categories may have different expectations depending on which shape it is. Acceptable for v1; would need a real fix (e.g. category-aware tier definitions, or a legend) if this becomes user-visible confusion later.

### Late-Night Venue Availability: 4 Fail-Closed Venues (2026-07-13)
`isVenueOpenAt` (app/_generate-plan.ts) parses `venue.hours` freeform strings to determine real availability. It fails closed on any clause it can't parse into a fixed day-and-time range, treating the venue as unavailable rather than guessing. Four venues currently fall into this bucket:
- Rock Creek Park and Gravelly Point Park: "Daily dawn to dusk" (no fixed clock time; actual dusk varies from about 5pm to 8:30pm across seasons)
- 9:30 Club: "Varies by show, doors typically 7pm" (no fixed hours; availability genuinely depends on whether a show is booked that night)
- Blues Alley: "Tue-Sun, shows at 8pm and 10pm" (discrete showtimes, not a continuous open/close range; "open" is ambiguous between the building being open and a show being in progress)

These four venues will never be selected for a time-filtered plan, regardless of actual real-world availability. This is an accepted tradeoff: a false negative (excluding a venue that's actually open) is preferable to a false positive (suggesting a genuinely closed venue). Revisit if a structured hours or showtime data source becomes available.

### Stop List Place Name Font: Not Changed
Considered switching stop list place names (Scout card, Outing Preview) from Plus Jakarta Sans 500/15px to Libre Baskerville 700, to match the For You card place name font. Rejected: the stop list already carries a category color bar, icon, category label, neighborhood, and divider per row. Adding Baskerville's heavier, wider glyphs to every row competes with that density rather than complementing it, and increases truncation risk on long real venue names. If revisited, try Jakarta Sans 600 (a weight bump within the same family) before reaching for a font-family change.

### Active Outing Transport Row Shows Only Real Data
Shows only the real connector mode and time, not all three (walk/drive/transit) as specced. Two of three modes had no real data, so fabricated estimates are suppressed rather than shown as placeholder times. Revisit when multi-modal transport data exists.

### Outing Preview: Fabricated Transport Time on Manual Add
`handleAddPlace` hardcodes a "10 min walk" connector estimate for any manually added stop, since no real distance data exists between all 30 curated places. This is the same category of fabricated-data problem flagged and rejected on the Active Outing transport row above, and is inconsistent with that decision. Not yet resolved here. Revisit alongside the transport-row fix, or replace with an honest "distance unknown" state, once real place-to-place data exists.

## Navigation & Suggestion Engine

### Stop-Count Rule Changed From the Original Locked Spec (2026-07-13)
This changed how many stops a generated plan gets at different times of day, and made the late-night case more forgiving than the original spec allowed.

The original specs (see Documentation and Process Notes below) listed the following as a locked decision: 4 stops before 3pm, 3 stops from 3pm to 6pm, 2 stops from 6pm to 9pm, and 1 stop after 9pm.

This has been superseded in code. The new rule (`getStopCountForTime`) is:
- Before noon: 4
- Noon to 4pm: 4
- 4pm to 8pm: 3
- 8pm and later: a ceiling of 3, though this is now a target, not a guaranteed count (see below)

Two things changed from the original: the time boundaries moved (3pm/6pm/9pm
became noon/4pm/8pm), and the late-night case is no longer a hard cap of 1. The motivation was that a fixed 1-stop-after-9pm outing looked thin or broken regardless of what was actually open nearby, especially for anyone testing the app in the evening.

The 8pm-and-later ceiling is now paired with real availability filtering (see "Late-Night Venue Availability" above): `generatePlan` clamps the actual stop count to the minimum of the ceiling and the number of genuinely open candidates, with a floor of 1. So an evening outing now honestly shows however many venues are really open (commonly 1 to 2 on a weeknight, given only 2 Nightlife venues and 4 Eat & Drink venues total are open past 8pm, and 2 of those only Friday and Saturday), rather than always forcing a specific number. This is an intentional "degrade honestly, don't pad" design: a plan with fewer stops than the ceiling is not a bug, it's the catalog's real evening availability.

The original spec documents were never checked into this repo and were never updated to reflect this change; this entry is the record of the divergence
for anyone comparing against that external material.

### Stop Sequencing Is Category-Based Only, Not Geographic (2026-07-13)
`generatePlan` sorts selected stops by a fixed category-priority order (Coffee & Cafés, then Outdoors, Markets, Arts & Culture, Experiences, Eat & Drink, with Nightlife always last) so plans read as a sensible day-to-night arc rather than random order. This is category-only: `Venue` has no coordinates, address, or lat/long field, and no venue-to-venue distance data exists anywhere in the repo (connector times are synthetic, calculated as `6 + random(15)` minutes, unrelated to actual geography). So two correctly-sequenced stops could still be on opposite sides of DC. This isn't
fixable without adding real venue location data. Flagging it as a real ceiling on "sensible" sequencing, not a bug to keep chasing right now.

### generatePlan: Unhandled Bottom-of-Fallback-Ladder Case
The fallback ladder (relax category first, then budget) correctly preserves exact category-and-budget matches and fills remaining slots from a widened pool (see the fix that preserves exact category and budget matches in the
fallback ladder).

Not handled: if even the fully widened pool (all venues matching budget, or all venues if budget also can't be satisfied) has fewer venues than `stopCount`, `generatePlan` will silently return a plan with fewer stops than the time-of-day rule promised (e.g. a 4-stop request returning 2 stops). No UI currently accounts for a plan with fewer stops than expected.

Not observed in testing against the current 24-venue catalog at the time this was written. The catalog was large enough, and Free-tier venues numerous enough, that this wasn't triggered by any tested input combination, including narrow-category-plus-Free-budget requests. Worth revisiting if the catalog shrinks, if a budget-and-category combination emerges that's genuinely this thin, or if onboarding ever allows combinations narrow enough to hit it.

### Zero-Availability Crash, Now Caught (2026-07-13)
This fixed a real crash: certain category-and-time combinations could leave `generatePlan` with nothing to suggest, and the app threw an error instead of
showing the user a message.

`generatePlan` throws when `isVenueOpenAt` filtering, combined with `selectPool`'s existing three-tier relaxation ladder (exact category and budget match, then any category at the same budget, then the entire 26-venue catalog at any budget), still yields zero available venues. Before real hours-filtering existed, that combination was structurally impossible: the relaxation ladder always widened to the full catalog with no time-based filtering, so it could never return zero. Adding real hours-filtering made zero a reachable case for the first time.

The throw was initially uncaught at all five call sites (outing-questions.tsx, outing-preview.tsx, first-plan-reveal.tsx, preferences.tsx, and _use-stop-completion.ts), meaning a real, shippable crash for any request whose category-and-time combination had nothing genuinely open. It's now caught everywhere via `Alert.alert` with a Scout-voiced message ("Nothing open right now" / "Try again later, or widen what you're looking for"). On catch, no navigation occurs and no store mutation happens, so the user stays exactly where they were.

Known remaining gap: outing-questions.tsx's "Find my outing" button has no minimum-category-selection gate. `selectedCategories` can be an empty array today, independent of this fix, and is an easy way to hit the zero-availability path. Not yet fixed. The alert now catches it instead of crashing, but a UX improvement (disabling the button, or hint text) is still worth doing.

### For You Daily Selection Is Session-Scoped, Not Persistent
`getDailyForYouSelection` caches the day's picks in a module-level variable, checked against today's date. This prevents reshuffling on re-render or remount within a session, but does not survive a cold start: force-quitting the app resets the cache, and a new selection is generated on relaunch. True cross-session daily persistence would require AsyncStorage, which is out of scope per the project's existing no-persistence v1 decision. Accepted gap.

## Active Outing & Ratings

### Inline Stop Completion and Rating on the Home Screen (2026-07-08)
- Extracted stop-completion and rating logic from active-outing.tsx into `useStopCompletion()` (app/_use-stop-completion.ts) so both the full screen and the Home active-outing card share one source of truth for stop progression, rating state, and outing completion.
- Built `StopRatingSheet` (app/_stop-rating-sheet.tsx) as a compact bottom-sheet variant of the full-screen `StopRatingPrompt`, used only on Home's card for non-final stops.
- Backdrop-tap-to-dismiss was removed from `StopRatingSheet`. It was originally built to match standard bottom-sheet convention, but this silently advanced the stop (discarding the rating opportunity) on an accidental tap outside the sheet. Only the explicit "Done" button dismisses it now.
- The final stop ("Finish Outing") from Home now shows the overall rating prompt directly, rather than navigating to active-outing.tsx first. This reverses an earlier decision made earlier in the same work session: the original plan was to still send the final stop to the full screen, but that required two taps to reach the same rating screen, which turned out to be bad UX once actually used.
- Home's "Previous stop" now updates the card in place via `handlePreviousStop()` rather than navigating away.

### Final-Stop Rating Added (2026-07-09)
Previously, completing the final stop skipped straight to the overall outing rating with no way to rate that specific stop. Per the original spec (Part 9) this was the intended design, but in practice it meant the last place visited never got individual signal, which matters for future personalization. Now every stop, including the final one, gets its own per-stop rating first, and the overall prompt follows immediately after.

### FAB Warning During an Active Outing (2026-07-09)
- Tapping the FAB while an outing is active now shows a confirmation sheet ("You've got somewhere to be already") instead of silently overwriting the active outing. `beginOuting()` has no built-in guard against clobbering an in-progress one, so this was a real data-loss risk, not just a UX nicety.
- "End it and start fresh" routes through the same `handleEndOuting()` path used elsewhere in the app for ending an outing early. Per spec, this skips per-stop rating and goes straight to the overall rating prompt, since the user is leaving a stop mid-visit rather than completing it. This is intentionally different from the normal Finish Outing flow, which does rate the final stop.
- After the overall rating is submitted, if the outing was ended via the FAB warning (not a normal finish), the user is carried straight into /outing-questions instead of landing back on Home. This avoids a redundant second FAB tap.
- The button label went through one revision: "Keep going" was changed to "Back to my outing," since "Keep going" was ambiguous (it could read as "proceed with the new outing" rather than "stay on my current one"). The progress line was reframed as stops remaining rather than stops completed, since that's more persuasive for a warning meant to make someone reconsider abandoning near-finished progress.

### Overall Outing Rating: Dominant-Category Tie-Break Rule
`getDominantCategory` (app/_overall-rating-prompt.tsx) picks the most frequent category among an outing's stops. On a tie, it resolves to whichever tied category's first stop appears earliest in the stops array. This is equivalent to "use the first stop's category" for an all-distinct-category outing, and generalizes correctly when the tie is between two categories that both outnumber a third. This rule was chosen because the original spec's tie-break wording ("use the first stop's category") is only unambiguous for the all-distinct case; this is the natural generalization. Revisit only if product wants a different tie-break, e.g. a fixed category order, if one is ever specified.

### Rating Prompts Wired Into the Real Active Outing Flow
app/_stop-rating-prompt.tsx and app/_overall-rating-prompt.tsx are now wired into app/active-outing.tsx, instead of being reachable only via the deleted app/_dev-rating-test.tsx scaffold. Per-stop rating shows on "Complete Stop" for a non-final stop; `completeCurrentStop()` itself is deferred until the prompt is dismissed (tap X, Skip, or after rating), so the overlay sits over the just-finished stop's view before the screen transitions to the next stop, matching the original spec's Part 9/12 ordering. The overall rating prompt shows full-screen on "Complete Stop" for the final stop and on "End outing" `regenerateScoutSuggestion()`, `endOuting()`, and `router.replace('/')` now run only after that prompt's `onSubmit`.

No persistence exists yet: `onRate`/`onSave`/`onSubmit` payloads are console-logged, consistent with these components' existing behavior. Actual storage remains a known v1 gap.

### Home Suggestion Regeneration on Outing End Is a Proxy, Not Real Personalization
app/active-outing.tsx now regenerates the home screen's Scout's Pick when an outing ends (on natural completion via the currentStop-null effect, and on
an early End Outing), so the home screen stops showing the exact same finished plan. This replaces an earlier, reverted attempt that called `generatePlan()` with hardcoded or empty `PlanInputs`.

Completion itself is checked inline (a `currentStop` null-check plus a `currentStopIndex === stops.length - 1` comparison), not via a dedicated helper. An `isOutingComplete()` function existed in _outing-store.ts but was never called anywhere; it was removed as dead code in a later cleanup pass.

The input source used is `deriveInputsFromPlan()`, exported from app/outing-preview.tsx (previously local and unexported; used there by the "Regenerate" button). It derives `PlanInputs` from the just-finished `OutingPlan`'s own data: categories from its stops, budget from the highest price tier among its stops, vibes from its `vibeTags`.

This is not real taste-profile-based personalization. There is no taste-profile or onboarding-answers store anywhere in this codebase today (confirmed by grep across app/, lib/, data/, store/). The FAB flow's `PlanInputs` (app/outing-questions.tsx) come from raw local component state set by direct user taps, not from any persisted store. `deriveInputsFromPlan` is a proxy: the next suggestion reflects the categories, vibes, and budget of the outing the user just did, not any modeled preference. Revisit once a real taste-profile or onboarding system exists; at that point this call site should switch to that system's input source instead.

### Active Outing: Directions Button Uses Text Search, Not Coordinates
The "Directions" button on the Active Outing hero card (app/index.tsx, `openDirections`) opens the user's default maps app via a name-and-neighborhood text query (e.g. "Compass Coffee, Logan Circle, Washington DC"), not real coordinates. Neither `Venue` (data/venues.ts) nor `Stop` (app/_outing-store.ts) has a lat/lng or street address field today, so there was nothing more precise to build a link from. Per the original spec (Part 10), "Get directions" should link out to the user's default maps app; this satisfies that at the text-search level. Revisit and switch to coordinate-based links if text-search accuracy becomes a problem, e.g. ambiguous venue names or wrong city matches.

The full-screen Active Outing detail (app/active-outing.tsx) has two more instances of this button — one on the current-stop block, one on the next-up card. Both were previously no-ops (`onPress={() => {}}`) despite rendering as active-looking buttons. Fixed by adding a local `openDirections` function to app/active-outing.tsx, duplicated from (not imported/shared with) app/index.tsx's version, since this codebase's convention is to keep cross-file logic in dedicated `_foo.ts` modules rather than importing between route files. All three instances now use the same text-search approach described above, so the coordinate-data caveat applies to all of them equally.

## Known Bugs Fixed

### Hooks-Order Bug in the Active Outing Screen
This fixed a crash risk in React's rendering rules: a hook was being called
conditionally, which can make React lose track of a component's state under
the right timing, even though it never actually crashed in production before
this was caught.

In app/active-outing.tsx, a `useEffect` sat after a conditional
`if (!plan) return null` early return, making it a conditionally-called
hook. This was invisible for months because the only path that nulled `plan`
also immediately called `router.replace('/')`, unmounting the component
before React could detect the mismatched hook count. It surfaced once the
Home screen's version of the same completion flow was built, since that flow
doesn't navigate away, so the same component could re-render with `plan`
newly null while staying mounted. Fixed by moving the effect above both early
returns and making it a no-op internally when `plan` or `currentStop` is
null.

Remaining follow-up: grep other screens for the same "hook after an early
return" pattern. This bug class could exist elsewhere and only surfaces under
specific unmount timing, so the absence of a crash so far isn't proof the
pattern isn't present elsewhere.

### Stray Revert of Centralized Color Tokens in outing-preview.tsx
During FAB-wiring work, `git status` surfaced an uncommitted, unexplained
diff in app/outing-preview.tsx that removed `import { C } from '../data/colors'` and replaced it with a fully inlined duplicate of the color token object. This directly undid commit bc8e28c ("extract shared Venue type and color constants into data/"). Neither prompt run in that session touched this file, and the root cause was never
identified. data/colors.ts itself was verified untouched and correct. The
file was reverted with `git checkout -- app/outing-preview.tsx`, and a clean
`git status` plus `npx tsc --noEmit` were confirmed before proceeding.

This is flagged as a pattern to watch: it was the third unexplained diff in
one session. If it recurs, treat it as a tooling reliability issue, not
routine cleanup.

### Outing Preview Caption and Name Fields Could Reopen in Edit State
This fixed a bug where reopening edit mode on Outing Preview could show the
name or caption field still in an editing state left over from a previous
session.

The `isEditingName` and `isEditingCaption` flags must be explicitly reset to
false everywhere `editMode` is set to false (the clean-exit path in
`handleBack`, `handleDiscard`, and `handleGenerate`). Missing this reset in
any one path causes the name or caption field to reopen in edit state the
next time edit mode is entered. Fixed 2026-07-05. If this resurfaces, check
for a new exit path that was added without the reset.

## Deferred / Cut Features

### Build Around Saved Places: Single-Seed Entry Point Deferred
Considered letting a For You card tap offer "build a plan around this
place," reusing the existing Build Around Saved Places engine with a single
seed instead of 3 or more hearted places. Rejected for now: there is no
engine. `BuildAroundCard` (app/index.tsx) is presentational only, has no
`onPress`, and `SAVED_PLACE_COUNT` is a hardcoded constant, not derived from
real saved-places state. Building the single-seed version means building
real saved-places tracking plus a proximity-aware plan-generation function
from scratch, not a reuse of existing logic. Deferred past prototype. When
built, it must include distance and neighborhood awareness so a single seed
in Georgetown doesn't pull recommendations from across the city.

### Place Detail (For You Tap-Through): "More Like This" Deferred
Considered a "more like this" section on the place detail screen opened from
a For You card tap. Deferred: it requires a similarity rule (category?
neighborhood? price?) that hasn't been designed. Don't build until that
matching logic is specified; a shipped "more like this" with undefined
similarity logic will look broken even if the UI is correct.

### Place Detail: Hours Shown Inconsistently Across Screens
`PlaceDetailModal` (outing-preview.tsx) does not show venue hours, while
`place-detail.tsx` (the detail screen reached from For You/Explore) does.
This is because `Stop` (app/_outing-store.ts) doesn't carry an `hours`
field — it's dropped during the Venue-to-Stop conversion in
`generatePlan`, even though `venue.hours` is read as an input signal during
generation (via `isVenueOpenAt`), just never copied onto the resulting
`Stop`. Fixing this would require either extending `Stop` with an `hours`
field and threading it through `generatePlan`, or doing a live lookup back
into `VENUES` by `stop.id` at render time in outing-preview.tsx. Deferred,
not done.

### Explore Venue Cards: Save Only From Detail Screen, Not the Card
Explore's venue cards (`VenueCard`) have no heart/save button at all,
unlike Home's `ForYouCard`, which shows one directly on the card.
`place-detail.tsx`'s detail screen does have a heart button regardless of
whether it was reached from For You or Explore, so Explore venues can be
saved, just only from the detail screen, not the card preview. This is an
intentional inconsistency, not a bug: adding an on-card heart to
`VenueCard` would be a new feature, not a fix, and was deliberately skipped
given time constraints.

### FAB Outing Creation Flow: Question Set Locked, With Deliberate Cuts (2026-07-06)
The FAB flow is distinct from onboarding: onboarding sets an overall taste
profile once, while this flow asks in-the-moment questions since preferences
change daily. It's kept to one screen, single-tap inputs only, no free text:

- People count: Solo / Date / Group (see the separate entry on what "Group"
  means below)
- Budget (reuses existing `priceTier` values)
- Duration (reuses the existing 4/3/2/1 stop-count-by-time-window engine; do
  not build a second duration-to-stop-count mapping)
- Vibe (a single set of chips)
- Category interests (multi-select from the 7 categories)
- Occasion (optional, single row, skippable: "just because / date /
  celebrating / trying something new")

Cut, deliberately, not just simplified:

- Distance radius slider. Wrong pattern for a 30-venue curated catalog,
  since it implies a search-database mental model the product explicitly
  isn't.
- A separate "energy" question. Redundant with vibe: one axis, one question,
  not two near-duplicate ones.
- "What to include" chips (good food, scenic, live music, etc.). Duplicates
  category interests and/or the per-stop swap/remove already in Outing
  Preview's edit mode. Don't build the same capability twice.
- "Anything to avoid" (negative filtering). This is real engine work
  (exclusion logic) that doesn't exist anywhere in the suggestion system yet,
  not a checkbox-sized feature. Revisit as its own scoped feature, not a FAB
  flow input.
- Free-text note. Unstructured input the engine can't act on for v1; it adds
  typing friction before the first plan reveal, which works against the
  product's own speed-to-value principle.
- A multi-entry-point menu (Build with AI / Saved Places / Plan Around
  Event). Collapses three distinct features into one confusing fork. The FAB
  opens this flow only. Build Around Saved Places stays a separate, existing
  home-screen entry point. "Plan Around an Event" requires the Events
  feature (Explore tab, not yet built); don't reintroduce it here.

### FAB Flow "Group" vs. Friends-Tab Duo Planning (Distinct Concepts)
"Group" in the FAB people-count question means one person, answering alone,
self-reporting that they're planning for multiple people. It only affects
pacing and stop-count assumptions for that single answer set; there's no new
data model and no other people involved in the session.

This is not the same as Duo/Friends collaborative planning, which would
require two separate existing taste profiles, a reconciliation step between
conflicting preferences (e.g. one person wants nightlife, the other wants a
quiet cafe), and an invite/accept flow, none of which exist. Duo Plans
remains out of scope for v1 (Friends tab). Don't treat "Group" in the FAB
flow as partial progress toward Duo Plans; they solve different problems,
and Duo Plans is a materially larger feature (a shared data model and
consent flow, not just a UI option).

### generatePlan Does Not Yet Accept Duration, People Count, or Occasion
The FAB question flow (app/outing-questions.tsx) intentionally asks only 3
questions (category, budget, vibe) because `PlanInputs` and `generatePlan()`
in _generate-plan.ts have no parameters for duration, people count, or occasion. `duration` exists in the `PlanInputs` type but is never read in the
function body (a dead parameter). People count and occasion don't exist in
the type at all. These are collected nowhere in the app currently. This is
deferred intentionally to keep FAB v1 scoped to what the engine can actually
act on. Revisit if and when `generatePlan()` is extended to use these
inputs.

### Known Dead Parameters Not Yet Cleaned Up
`useStopCompletion`'s `outingId` parameter and `OverallRatingPrompt`'s
`outingId` prop are both unused in their current implementations. They're
placeholders for future multi-outing support. This has been flagged twice
during development; decide once (strip now vs. wire up later) rather than
rediscovering the same question each time.

### Explore, Friends, and Profile Tabs: What's Built and What's Still Missing
These three tabs moved past the original "one holding screen per tab" plan
and now have working functionality, not placeholders:

- **Explore**: real category filter chips (a wrapped grid, single-select)
  wired to a venue grid pulled live from data/venues.ts.
- **Friends**: a requests list with working accept/decline (local state), a
  friends list, and a Duo Planning entry point (an info sheet), plus an Add
  Friend info sheet.
- **Profile**: a real header (user name and email from
  _user-profile-store.ts) and navigation rows to Drafts, Outing History, and
  Preferences.

What's still not built within these tabs (each still explicitly a v1 gap, not
an oversight):

- **Explore**: no search or sort, just category filtering. Venue cards are a
  local copy of `ForYouCard` with the heart/save button intentionally
  omitted. No saved/trending/hidden-gems/pre-made-outings/events views from
  the fuller Explore information architecture originally specced.
- **Friends**: no store and no backend (per the file's own header comment).
  Requests and friends lists are hardcoded seed data, mutated only in local
  component state. No real invite flow, no networking or friend-request
  backend, and nothing persists across an app restart.
- **Profile**: only 3 rows (Drafts, Outing History, Preferences). No stats,
  badges, or settings screen yet; those remain unspecified.

## Documentation & Process Notes

### DECISIONS.md Relocated to the Repo Root, Then Merged Again
This file previously accumulated at `.expo/~/ForageApp/Decisions.md`, inside
the gitignored .expo/ cache directory, under a literal `~` folder (almost
certainly the same class of tooling path bug described in "Stray Revert of
Centralized Color Tokens" above). Everything written there was invisible to
git and to anyone not in that exact local environment.

The full history was first copied to DECISIONS.md at the repo root so it
would be tracked normally going forward. At that time, the stray file was
left in place rather than deleted.

That turned out to be a mistake: the same tooling bug kept writing new
entries to the stray file after the relocation (dated July 8, 9, and 13),
instead of to the tracked file. Those entries sat invisible to git for over
a week until they were found and merged into this file during a later
cleanup pass, alongside a readability rewrite of the whole document. The
stray file has now been deleted. If entries seem to be missing again in the
future, check for a similarly stray file before assuming they were never
written.

### Spec Documents Referenced in This Project Are Not in This Repo
Early design decisions in this project referenced external planning
documents, including files named `forage_master_spec_v6.md` and
`forage_app_spec_v5.md`, as the source of specced behavior (stop counts,
transport rows, tie-break rules, and other decisions throughout this file
cite them directly).

None of these documents are checked into this repository, and neither is a
`forage_project_context.md` that some earlier notes assumed existed
alongside them. This was confirmed by searching the full working tree and
git history: none of the three files exist now, and none has ever been
committed to this repo.

This is resolved, not an open question: these were external documents used
during design and development that were never added to version control, and
they won't be added going forward. Anywhere this file cites "the spec" or "the original spec," that's a reference to that external, untracked material, not to a file a reader of this repo can open. Entries in this file are meant to be self-contained records of what was decided and why; they don't require the original spec documents to make sense.

### Generate New Outing: Rapid Double-Tap Not Fully Guarded (2026-07-21)
The "Generate new outing" button in outing-preview.tsx guards against re-entry via React state (`isRegenerating`) rather than a ref. State updates are async/batched, so a genuine rapid double-tap can occasionally fire `handleGenerate()` twice before the first tap's state update commits — the `disabled` prop only reliably blocks a *second, separate* tap made after the button visually disables. Left as-is: `generatePlan()` is synchronous and purely local (no network call, no database write), so the worst case is a harmless double-computation and a visual flicker, not data corruption or a 
duplicate write. A proper fix would use a `useRef` boolean instead of state for synchronous re-entry protection — low priority, revisit as a standalone polish pass if it ever becomes user-visible.