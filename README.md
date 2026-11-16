# Survivor

A top-down "survivor"-style action game for the browser, built with Phaser 3 and Vite. The player moves around an
endless arena while weapons fire automatically at waves of enemies. Killing enemies drops experience; every level-up
offers a choice of three upgrades (new weapons or stronger versions of owned ones). Elite waves, treasure chests,
temporary power-ups and a necromancer boss appear as the run goes on. Between runs, the currency earned ("soul ash")
buys permanent upgrades, weapon unlocks and achievement rewards in a meta shop on the home screen.

All art is either optional bitmap files or generated procedurally at start-up, so the game runs with no external assets
and no backend.

## Quick start

Requirements: Node.js `^20.19` or `>=22.12` (Vite 7) and npm. No GPU, database or network services are needed.

```bash
npm ci          # install exact dependency versions from package-lock.json
npm test        # run all unit tests once (Vitest, Node environment, no browser)
npm run build   # production build into dist/
npm run dev     # local dev server (Vite); open the printed URL to play
```

## Features

- **Weapons and abilities:** projectiles, blades, chain lightning, boomerang, nova, meteor, flamethrower, lance, spear
  barrage, burst rifle, arc mines and rune traps, each with its own upgrade path.
- **Progression in a run:** XP curve and level-ups, randomised upgrade choices, chest rewards, temporary power-ups
  (frenzy, overcharge, volley, frost) and a compass pointing to the nearest drop.
- **Enemies:** spawn profiles that ramp up over time, elite waves, enemy behaviours, a timed boss encounter, and level of
  detail for large crowds.
- **Meta progression:** a versioned profile saved in `localStorage` (key `survivor.metaProfile.v1`) with a shop (max
  health, pickup radius, move speed, starting XP, rerolls, revive), weapon unlocks and achievements.
- **UI:** home screen, journal of discovered enemies and weapons, damage statistics, weapon tooltips, health bar and FPS
  counter.

## Project layout

| Path | What it holds |
|---|---|
| `index.html`, `src/main.js` | Page shell and Phaser game configuration with the two scenes. |
| `src/game/scenes/` | `HomeScene` (menu, meta shop) and `GameScene` (one run: texture generation, input, update loop). |
| `src/game/logic/` | Pure game rules with no Phaser dependency: progression and upgrade definitions (`progression.js`), combat maths and spatial enemy queries (`combat.js`), spawning, chests, power-ups, boss timing, per-weapon behaviour, and helpers that compute visual parameters. |
| `src/game/systems/` | Managers that connect the rules to Phaser objects, one per weapon or feature (enemies, projectiles, pickups, bosses, audio, damage stats and so on). |
| `src/game/meta/` | Saved profile (`defaultProfile.js`, `metaProgression.js`), shop data, rewards and achievements. |
| `src/game/entities/` | The player entity. |
| `src/game/ui/` | Overlays (level-up choices, chest rewards, journal). |
| `src/assets/` | Optional bitmap art, auto-discovered by file name; see `src/assets/bosses/necromancer/README.md`. |
| `tests/` | Vitest unit tests, one file per logic module or system (`tests/<module>.test.js`). |

## Architecture and conventions

- **Rules live in pure functions.** Anything that decides numbers or outcomes (damage, XP, choices, timers, drop
  chances, costs) belongs in `src/game/logic` or `src/game/meta` as a function that takes plain data and returns plain
  data. Systems in `src/game/systems` and the scenes only call these functions and move Phaser objects.
- **Randomness is injected.** Functions that roll dice take an `rng` argument (defaulting to `Math.random`) or explicit
  roll values, so tests can pass fixed numbers and get deterministic results.
- **Data before code.** Upgrades, shop items, achievements, power-ups and boss timings are defined as exported constants
  (`UPGRADE_DEFINITIONS`, `META_SHOP_DEFINITIONS`, `ACHIEVEMENT_DEFINITIONS`, ...) and read by the logic functions.
- **Saved data is versioned.** The profile carries `version` (`META_PROFILE_VERSION`); loading merges saved values over
  defaults, so new fields need a default in `createDefaultMetaProfile()`.
- **Style:** plain JavaScript ES modules, named exports, no TypeScript, no extra runtime dependencies beyond Phaser.

## Testing

- `npm test` runs about 330 tests in 47 files under `tests/`. They cover the XP curve, upgrade pools and choices,
  combat geometry, spawn profiles, chest and power-up rolls, boss timing, achievements, meta shop purchases and profile
  loading, each weapon system, and the overlay and scene helpers that can run without rendering.
- New behaviour gets tests in the matching `tests/<module>.test.js` file (or a new one), using fixed `rng` values and
  exact expected numbers.
- Verification is done with `npm test` and `npm run build` only. Do not try to run, record or screenshot long gameplay
  sequences: the game needs a real browser and GPU for that, and the unit tests cover the rules.

A change is done when `npm test` and `npm run build` both pass with no new warnings other than Vite's existing chunk-size
notice.
