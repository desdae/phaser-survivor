# Survivor Prototype Design

## Summary

Build a Phaser-based top-down survivor prototype focused on a single playable run. The player moves with `WASD`, automatically fires at the nearest enemy, collects XP orbs, levels up into a paused upgrade choice, and eventually dies into a restart flow. The first version should be intentionally lean so we can validate the core loop before adding broader content.

## Goals

- Deliver a playable prototype with one main gameplay scene.
- Keep the architecture modular enough to support additional enemies, abilities, and upgrades in the next scope.
- Make the world feel endless by continuously spawning enemies outside the visible play area instead of relying on fixed map boundaries.
- Provide a full run loop: start, survive, level up, die, and restart.

## Out of Scope

- Main menu
- Character selection
- Meta progression between runs
- Audio polish
- Multiple weapons or advanced ability combinations
- Narrative or quest systems

## Core Gameplay Loop

1. Start a run in a top-down 2D scene.
2. Move the player with `WASD`.
3. Spawn enemies from all directions outside the camera bounds.
4. Have enemies continuously chase the player.
5. Auto-fire projectiles at the nearest valid enemy on a repeating cooldown.
6. On enemy death, drop XP orbs.
7. Collect XP orbs by moving over them.
8. When enough XP is gathered, pause gameplay and present 3 upgrade choices.
9. Apply the selected upgrade and resume the run.
10. End the run when player health reaches `0`, then show a restart flow.

## Architecture

### Boot and Scene Flow

- `main.js` boots Phaser and starts the main gameplay scene.
- A single `GameScene` manages the runtime loop for the prototype.
- `GameScene` is responsible for camera follow, elapsed time tracking, pause and resume behavior, and restart handling.

### Runtime Systems

- `Player`
  - Owns movement, health, XP, level state, and weapon stats.
  - Exposes update hooks for movement and combat timers.
- `EnemyManager`
  - Spawns enemies around the camera edge.
  - Tracks active enemies and difficulty progression.
- `ProjectileManager`
  - Creates projectiles, updates their travel, and resolves hits.
- `PickupManager`
  - Spawns and manages XP orb pickups.
  - Handles player collection overlap and XP gain.
- `UpgradeSystem`
  - Defines upgrade entries and rolls 3 level-up options.
  - Applies selected upgrades to the player state.
- `UI`
  - Renders health, level, XP progress, elapsed time, level-up overlay, and game-over overlay.

### Data Flow

- Input updates player velocity every frame.
- Enemy spawning uses elapsed run time to ramp frequency and composition.
- Auto-attack finds the nearest living enemy within the active enemy set and fires toward it when cooldown is ready.
- Projectile collisions reduce enemy HP.
- Enemy death triggers XP orb spawning.
- Orb collection increases XP and triggers level-up checks.
- Level-up pauses combat and movement until the player selects one of 3 upgrades.
- Enemy contact deals damage on a controlled tick so collision remains readable.

## World and Camera

- The world should be treated as effectively unbounded for prototype purposes.
- The camera follows the player at all times.
- We do not need a handcrafted map for this phase.
- Enemy spawn positions should be chosen from outside the current visible camera rectangle so threats arrive from every side.
- Background rendering can stay minimal, such as a repeating grid or flat field, as long as movement is readable.

## Player Rules

- Movement uses `W`, `A`, `S`, `D`.
- The player starts with a single ranged weapon that automatically targets the nearest enemy.
- The player has finite health.
- The player gains XP and levels during the run.
- The player dies when health reaches `0`.

## Combat Rules

### Starting Weapon

- One basic projectile weapon.
- Auto-fires at the nearest valid enemy.
- Fires on a repeating cooldown.
- Projectiles travel toward the targeted enemy direction and expire after impact or range timeout.

### Enemy Contact Damage

- Enemies deal damage when touching the player.
- Contact damage should use a cooldown or damage tick to prevent instant deletion from stacked overlaps.

## Prototype Enemy Set

### Basic Chaser

- Common from the start.
- Low health.
- Normal movement speed.
- Drops a small XP orb value.

### Tough Chaser

- Introduced after an early elapsed-time threshold.
- Higher health than the basic chaser.
- Slightly slower movement.
- Drops more XP than the basic chaser.

## Difficulty Progression

- Difficulty ramps only by elapsed run time in the prototype.
- Spawn frequency increases as time passes.
- Spawn group size gradually increases.
- Tough chasers begin appearing after the initial phase.
- The prototype should feel noticeably harder after surviving for a while, but the scaling does not need to be deeply tuned yet.

## XP and Leveling

- Enemies drop XP orbs on death.
- The player collects XP by overlapping with the orb.
- XP thresholds increase player level.
- On level-up, gameplay pauses and a level-up overlay appears.
- The player sees exactly 3 upgrade choices and selects 1.
- The chosen upgrade applies immediately, then gameplay resumes.

## Prototype Upgrade Pool

- Increase projectile damage.
- Increase fire rate.
- Increase projectile speed.
- Increase max health.
- Restore some health immediately.
- Increase XP pickup radius.

## UI and Screens

### HUD

- Current health
- Current level
- XP progress toward next level
- Elapsed survival time

### Level-Up Overlay

- Appears when leveling up.
- Pauses gameplay while shown.
- Presents exactly 3 upgrade cards or buttons.
- Player chooses 1 upgrade to continue.

### Game-Over Overlay

- Appears when player health reaches `0`.
- Shows elapsed time survived.
- Shows final level reached.
- Offers a restart action by button or key prompt.

## Testing and Acceptance Criteria

- Player moves smoothly with `WASD`.
- Camera reliably follows the player.
- Enemies spawn from off-screen around the player rather than from a fixed single edge.
- Enemies continuously chase the player.
- Auto-attack consistently targets the nearest valid enemy.
- Projectiles damage and kill enemies correctly.
- Enemy deaths create XP orbs.
- XP orbs can be collected reliably.
- Level-up triggers after enough XP is collected.
- Level-up pauses gameplay and resumes after a choice is made.
- Upgrades apply immediately and affect the run.
- Difficulty becomes noticeably harder over time.
- Player death cleanly transitions to a restartable game-over state.

## Implementation Notes

- Favor small, focused files over a single large scene script.
- Keep systems simple and readable; avoid over-engineering data-driven infrastructure in the first pass.
- Choose structure that makes it easy to add new enemy definitions, weapon behavior, and upgrade entries in the next scope.
