# Survivor Meta Progression Design

Date: 2026-04-13

## Goal

Add a first-pass between-run progression layer that increases replayability without diluting the current run-based combat loop.

The primary progression system will be a persistent meta-currency called `Soul Ash` spent on permanent upgrades between runs. This pass also adds a permanent weapon unlock path and a lightweight achievement ledger, but both remain secondary to the currency shop.

## Summary

The current project already has strong in-run variety through abilities, elites, boss encounters, temporary buffs, chests, and the journal. The largest missing layer is long-term retention across multiple runs.

This design adds:

- persistent save data
- end-of-run `Soul Ash` payouts
- a between-run shop for small permanent upgrades
- a permanent weapon unlock path that gates parts of the arsenal over time
- a side-system achievement ledger that mostly grants currency and only rarely grants tiny permanent bonuses

This pass does not add:

- multiple currencies
- character classes
- online profiles or cloud saves
- cosmetic inventory systems
- a deep account-wide talent tree
- a large main-menu presentation overhaul

## Design Principles

- The run should remain the core source of excitement. Meta systems should amplify replayability, not replace build decisions made during a run.
- `Soul Ash` should be useful immediately after the first few runs.
- Permanent power gains should be modest and readable so early combat does not become trivial.
- Weapon unlocks should create anticipation and player-directed goals without making the early game feel barren.
- Achievements should feel rewarding, but they should not become the dominant source of permanent power.
- The implementation should fit the current single-scene Phaser structure and existing overlay patterns.

## Player Experience

### First-Time Player

- The player starts with the base projectile weapon and a small initial weapon roster or starter set.
- They complete a run, die or win, and see a `Soul Ash` payout summary on the run-end flow.
- They return to a simple hub or menu state where they can spend `Soul Ash` before starting the next run.
- Their first purchases should arrive quickly enough to create momentum.

### Returning Player

- Each run contributes toward both immediate combat progression and long-term account growth.
- The player spends `Soul Ash` on small stat upgrades, utility upgrades, and new weapon unlocks.
- Achievements provide extra goals such as killing bosses, surviving longer, or mastering certain weapons.
- Over time, the player develops a broader upgrade pool and more strategic choice about what kind of run they want to pursue.

## Scope

This pass adds four connected pieces:

1. persistent profile save/load
2. `Soul Ash` reward calculation and payout
3. meta shop purchases
4. permanent unlocks and achievements

The recommended implementation order is:

1. save profile and payout pipeline
2. meta shop
3. weapon unlock gating
4. achievement ledger

## Core System: Soul Ash

### Currency Identity

`Soul Ash` is the single permanent currency used for meta progression in this pass.

It should be:

- easy to understand
- always visible in the between-run UI
- granted from multiple run events
- spent on both power and unlock progression

### Payout Sources

The first pass should keep rewards simple and transparent:

- survival time
- elite kills
- boss kills
- chest opens
- first-time journal discoveries
- achievement claims

### Recommended Starting Payouts

These values are intended as first-pass tuning targets:

- `1 Soul Ash` per 30 seconds survived
- `5 Soul Ash` per elite kill
- `20 Soul Ash` per boss kill
- `3 Soul Ash` per chest opened
- `10 Soul Ash` for selected first-time discovery milestones

The end-of-run summary should show a row-by-row breakdown so players understand why they earned what they earned.

## Persistent Save Data

### Storage

Use a single versioned local save profile stored in browser persistence such as `localStorage`.

This is the lowest-risk first pass because:

- the current project is already client-side
- no backend infrastructure is required
- save migrations can be handled with a simple version field

### Suggested Shape

```js
{
  version: 1,
  meta: {
    soulAsh: 0,
    lifetimeSoulAshEarned: 0,
    totalRuns: 0,
    bestTimeMs: 0,
    eliteKills: 0,
    bossKills: 0,
    chestsOpened: 0
  },
  shop: {
    maxHealthLevel: 0,
    pickupRadiusLevel: 0,
    moveSpeedLevel: 0,
    startingXpLevel: 0,
    rerollLevel: 0,
    reviveUnlocked: false
  },
  unlocks: {
    weapons: ["projectile", "blade", "chain"],
    startingLoadoutSlots: 1
  },
  achievements: {
    beatNecromancer: { unlocked: false, claimed: false },
    survive10Minutes: { unlocked: false, claimed: false }
  }
}
```

The exact starter weapon list can be tuned, but the profile shape should clearly separate:

- economy totals
- purchased shop upgrades
- permanent content unlocks
- achievement state

### Migration and Safety

- Missing save data should cleanly fall back to defaults.
- Unknown or older save versions should be migrated forward before use.
- Corrupt save payloads should reset to defaults rather than breaking game startup.

## Between-Run Shop

### Purpose

The meta shop is the main spending sink for `Soul Ash`.

Its role is to:

- make each run feel valuable
- provide small evergreen account upgrades
- create medium-term goals without requiring a complex tree UI

### Upgrade Types

The first pass should focus on a compact set of modest upgrades:

- max health
- pickup radius
- move speed
- starting XP
- rerolls per run
- revive unlock

These upgrades align with existing systems already present in the project and do not require a new combat framework.

### Tuning Direction

Recommended first-pass effects:

- `Max Health`: `+5` per level, cap `5`
- `Pickup Radius`: `+8` per level, cap `5`
- `Move Speed`: `+2%` per level, cap `5`
- `Starting XP`: `+5%` per level, cap `4`
- `Reroll`: grants extra level-up rerolls, cap `2`
- `Revive`: one expensive unlock that grants a single revive per run

Recommended first-pass costs:

- level 1: `20`
- level 2: `40`
- level 3: `75`
- level 4: `125`
- level 5: `200`
- revive unlock: about `250`

Exact balance can shift during implementation, but the shape should preserve a steady sense of progress across early and mid runs.

### Application Rules

- Shop bonuses apply automatically at the start of a run.
- Run-time temporary buffs remain separate from shop bonuses.
- Purchased upgrades must be visible somewhere in the between-run UI so the player can understand what is active.

## Permanent Weapon Unlock Path

### Purpose

The current roster is already broad. A permanent unlock layer can turn that content into a long-term progression path without immediately requiring brand-new abilities.

### Unlock Behavior

- Not every weapon should be available to new profiles from the start.
- Unlocking a weapon permanently adds it to the run's available unlock pool.
- Once unlocked at the account level, that weapon behaves exactly as it does today during a run.

This preserves the current in-run progression model while adding a new long-term goal.

### Suggested Structure

For the first pass, keep the UI simple:

- a list, grid, or lightweight constellation view
- each weapon shows locked or unlocked state
- locked weapons show cost and a short identity description
- unlocked weapons show that they can now appear in-run

The implementation does not need a highly animated constellation screen yet. A static but readable unlock view is enough.

### Tuning Direction

Suggested first-pass cost bands:

- early weapons: `30-50`
- mid-complexity weapons: `60-90`
- high-agency aimed weapons: `100-140`

The player should still begin with enough variety that the game feels fun before many purchases. The unlock path should shape anticipation, not starve the early game.

## Achievement Ledger

### Purpose

Achievements are a side system, not the primary growth engine.

They should:

- create extra goals
- reward mastery and experimentation
- grant mostly currency and flavor rewards
- only rarely grant tiny permanent account bonuses

### Reward Philosophy

Most achievements should reward one of:

- `Soul Ash`
- unlockable shop tiers
- journal embellishments
- profile badges or future cosmetic hooks

Only a curated minority should grant permanent power. Example:

- `+1% overall damage`
- `+1% move speed`
- `+2% chest reward chance`

Total permanent combat power from achievements should remain tightly capped. A good first-pass target is keeping aggregate achievement power roughly within the `5-8%` range.

### Example Achievements

- defeat the Necromancer once
- survive 10 minutes
- open 25 chests
- kill 500 bats
- win a run with 6 learned abilities
- defeat a boss using a specific weapon family

### Claim Flow

- Achievements should unlock automatically when conditions are met.
- Rewards should be claimable from the achievement ledger so the player gets a small reward moment.
- Claimed achievements should never grant rewards twice.

## Runtime Integration

### End-of-Run Flow

When a run ends:

1. compute `Soul Ash` from tracked run stats
2. add it to persistent profile state
3. update lifetime counters and best-run stats
4. evaluate achievements unlocked during the run
5. present a summary that clearly separates:
   - run results
   - `Soul Ash` earned
   - newly unlocked achievements

### Start-of-Run Flow

When a new run begins:

- load the persistent profile
- apply purchased shop bonuses to the player's starting stats
- filter weapon unlock availability based on profile unlocks
- initialize any per-run meta features such as rerolls or revive charges

### Upgrade Pool Integration

The current `abilityRoster` and `progression` modules already provide a good seam for gating what can appear in-run.

The permanent unlock layer should feed into ability availability before level-up options are rolled. Locked account-level weapons should not appear as run-time unlock choices.

## UI and UX

### New Surfaces

The first pass needs three core between-run views:

- a simple home or hub screen
- a meta shop overlay or screen
- an achievement ledger overlay or screen

The unlock view can be folded into the shop or separated if the menu remains readable.

### Content Requirements

The UI should always show:

- current `Soul Ash`
- upgrade costs
- current upgrade levels
- locked and unlocked weapon states
- achievement progress where practical

### Constraints

- Reuse the project's current overlay style and scene conventions where possible.
- Avoid a huge front-end rewrite just to support the first progression pass.
- Keep the first hub/menu readable on desktop without assuming a full console-style navigation layer.

## Architecture Direction

### New Modules

Add focused modules rather than pushing persistence and economy rules into `GameScene`.

Suggested seams:

- `metaProgression.js`
  - save/load
  - migrations
  - currency totals
  - shop purchases
- `metaRewards.js`
  - end-of-run payout calculation
  - reward breakdown rows
- `achievementLedger.js`
  - achievement definitions
  - unlock checks
  - claim handling
- `metaShopData.js`
  - upgrade definitions
  - costs
  - stat application rules

### Existing Systems to Reuse

- `progression.js` for level-up rules and upgrade-pool adjacency
- `abilityRoster.js` for owned and available abilities
- `journalData.js` and discovery tracking for first-time discovery rewards
- existing overlay factory patterns for between-run screens

### Boundaries

- `GameScene`
  - remains responsible for run orchestration and reporting run results
- meta progression modules
  - own persistence, purchases, unlock state, and payout logic
- UI overlays or a simple menu scene
  - own between-run interaction and presentation

## Data Tracking Requirements

The run should track enough information to support rewards and achievements, including:

- survival time
- elite kills
- boss kills
- chest opens
- enemy kill counts by type where practical
- newly discovered journal entries
- learned ability counts
- win or loss state

This can be added incrementally, but the first pass should avoid hardcoding reward logic to transient scene state that cannot be tested independently.

## Balancing Guardrails

- Do not let permanent bonuses overshadow in-run choices.
- Avoid very large percentage multipliers on global damage or fire rate.
- Ensure a new profile can still access enough interesting content before many purchases.
- Keep reward messaging transparent so the player understands progression.
- Treat achievement power rewards as rare and capped.

## Testing and Acceptance Criteria

Add or update tests to cover:

- default profile creation
- save load and migration behavior
- corrupt save fallback
- purchase validation and currency deduction
- shop bonus application at run start
- weapon unlock gating affecting run-time upgrade availability
- end-of-run payout calculation
- achievement unlock and claim rules
- first-time reward sources not paying out repeatedly

Verification should include:

- `npm test`
- `npm run build`

## Recommended First Implementation Slice

If implementation needs to stay narrow, the smallest valuable slice is:

1. persistent profile with `Soul Ash`
2. end-of-run payout summary
3. shop with three upgrades:
   - max health
   - pickup radius
   - move speed

Then expand to weapon unlocks and achievements once the economy loop feels good.

## Open Decisions Resolved For This Spec

To keep the first implementation unblocked, this spec makes the following explicit choices:

- `Soul Ash` is the only permanent currency in this pass.
- The meta shop is the primary progression sink.
- Weapon unlocks are permanent account-level gates for run-time unlock availability.
- Achievements are a side system and mostly grant currency, not power.
- Only a curated minority of achievements may grant tiny permanent bonuses.
- Persistence is local-only for now.

This keeps the design focused enough for a single implementation plan while leaving room for future expansion into more elaborate account systems.
