# Survivor MVP Design

## Summary

Expand the current survivor prototype into a solid MVP by adding more build variety, enemy behavior variety, and a cleaner content structure. The existing run loop remains the foundation: move with `WASD`, survive enemy pressure, collect XP, level up into 3 choices, and restart on death. Scope 2 adds a meaningful second ability path, more expressive projectile upgrades, and ranged enemy pressure without jumping to full meta progression.

## Goals

- Keep the current prototype loop intact and make it feel deeper rather than wider.
- Add one unlockable secondary auto-ability: an orbiting blade.
- Expand projectile upgrades into real behavior changes instead of mostly numeric tuning.
- Add a ranged enemy type that changes positioning demands during a run.
- Improve internal structure so future abilities and enemy types can be added without piling more special cases into `GameScene`.

## Out of Scope

- Main menu
- Character selection
- Meta progression between runs
- Audio polish
- Multiple new active abilities beyond the orbiting blade
- Full status-effect systems
- Boss fights or map objectives

## Scope 2 Gameplay Loop

1. Start the run with the existing basic projectile weapon.
2. Survive enemies while collecting XP.
3. Level up into 3 upgrade choices.
4. Optionally unlock the orbiting blade through a level-up pick.
5. Continue leveling into projectile and blade-specific upgrade paths.
6. Fight a mixed enemy roster that now includes ranged spitters.
7. Die, see the end-of-run summary, and restart.

## Architecture Direction

### Keep Existing Core Modules

- Keep the Phaser + one-scene runtime structure already established.
- Keep the current `Player`, `EnemyManager`, `ProjectileManager`, `PickupManager`, `UpgradeSystem`, and overlay UI flow.
- Continue treating gameplay rules as small modules where possible so they can be tested outside the scene.

### Introduce Lightweight Combat Definitions

- Move projectile weapon behavior toward a definition-driven structure instead of hardcoded single-shot assumptions.
- Treat the orbiting blade as its own unlockable passive ability with dedicated stats and update logic.
- Expand enemy behavior to be type-based instead of assuming every enemy simply runs directly at the player forever.

### Boundaries

- `GameScene`
  - Orchestrates the run and remains responsible for pause, resume, restart, and cross-system wiring.
- `ProjectileManager`
  - Reads projectile weapon stats and spawns shots according to count, spread, pierce, and ricochet rules.
- `Blade system` or blade handling module
  - Owns orbiting blade lifecycle, movement around the player, and enemy hit cadence.
- `EnemyManager`
  - Handles spawn composition, per-enemy behavior updates, enemy projectiles, and active enemy bookkeeping.
- `UpgradeSystem`
  - Filters upgrade choices based on whether the blade is unlocked and what branches are already active.

## Combat Systems

### Base Projectile Weapon

The player still starts with the basic auto-target projectile weapon. Scope 2 expands its mutable stats so the weapon can branch into more distinct builds.

Projectile weapon stats should include:

- projectile damage
- projectile speed
- fire cooldown
- projectile count
- pierce count
- ricochet count
- spread angle or projectile fan behavior

### Orbiting Blade Ability

- The orbiting blade does not start active.
- It first enters the run as a level-up unlock choice.
- Once unlocked, it continuously orbits the player and damages enemies on contact.
- Blade stats should include:
  - unlocked state
  - blade count
  - blade damage
  - orbit radius
  - orbit speed
- Blade damage should use a hit cooldown per enemy so one overlap does not deal damage every frame.

### Enemy Projectiles

- Spitters fire projectiles toward the player on a cooldown.
- Enemy projectiles should be distinct from player projectiles and tracked separately.
- Player damage can now come from enemy contact or enemy projectiles.

## Enemy Roster

### Basic Chaser

- Still the most common enemy.
- Low health.
- Normal speed.
- Primarily used to maintain constant pressure and fill space.

### Tough Chaser

- Higher health than the basic chaser.
- Slower but more durable.
- Used to create lanes and soak projectile fire.

### Spitter

- New ranged enemy type.
- Lower health than the tough chaser but more tactically disruptive.
- Prefers to stay within a standoff range band instead of always closing fully to melee.
- Fires slower, readable projectiles toward the player.
- Encourages repositioning and prioritization.

## Difficulty Progression

- Continue scaling by elapsed run time.
- Increase not only spawn volume, but also roster composition complexity.
- Early run should favor basic chasers.
- Mid run should mix basic and tough chasers.
- Later run should introduce spitters in increasing weights while preserving swarm pressure.
- Difficulty should feel more varied because threat types combine, not just because numbers go up.

## Upgrade Economy

### Roll Rules

- Level-up still pauses gameplay and presents exactly 3 choices.
- The upgrade pool should be filtered by current run state.
- Before the blade is unlocked, `Unlock Orbiting Blade` may appear.
- After the blade is unlocked, blade upgrade entries may appear instead.
- Duplicate upgrade offerings are allowed across different level-ups, but the 3 choices shown at one time should remain distinct.

### Scope 2 Upgrade Pool

- Unlock orbiting blade
- Increase blade count
- Increase blade damage
- Increase blade orbit speed
- Increase blade orbit radius
- Multi-shot
- Pierce
- Ricochet
- Increase projectile damage
- Increase fire rate
- Increase max health
- Restore health
- Increase pickup radius

### Upgrade Intent

- Multi-shot should make the ranged weapon feel broader and better for crowd control.
- Pierce should reward lining up enemies.
- Ricochet should help with clustered targets and make later waves feel more reactive.
- Blade upgrades should clearly strengthen close-range survival and area denial.
- Health, healing, and pickup radius remain support upgrades, but the pool should tilt more toward build identity than the prototype did.

## UI and UX

- Keep the current HUD and overlay structure.
- Update level-up card copy so it clearly distinguishes unlocks from upgrades.
- Show enough text on upgrade cards for the player to understand whether a choice affects projectiles, the blade, or survivability.
- Keep keyboard support for level-up selection.
- Keep the pause-on-level-up behavior and end-of-run summary.

## Data Flow

- Auto-fire queries weapon stats and spawns one or more projectiles accordingly.
- Projectile hits may stop, continue through, or bounce depending on current projectile upgrade state.
- Orbiting blade updates continuously while unlocked and resolves its own enemy hits.
- Enemy manager updates movement intent per enemy type:
  - chasers close in
  - spitters maintain distance and shoot
- XP collection, level-up, and upgrade selection continue to flow through the existing player progression loop.

## Testing and Acceptance Criteria

- The player can unlock the orbiting blade through a level-up pick.
- Once unlocked, the blade visibly orbits and damages enemies reliably.
- Projectile upgrades visibly change combat behavior, not just damage numbers.
- Multi-shot fires multiple projectiles in a readable spread.
- Pierce allows projectiles to continue through enemies.
- Ricochet allows projectiles to bounce to nearby enemies after impact.
- Spitters appear later in a run and attack from range.
- Enemy projectiles can damage the player.
- Runs can diverge meaningfully based on chosen upgrades.
- The level-up system correctly filters blade unlock vs blade upgrades.
- Existing prototype behavior remains stable: movement, XP gain, level-up pause, death, and restart still work.

## Implementation Notes

- Favor a light refactor over a full combat framework rewrite.
- Move new branching rules into focused modules or definitions where practical.
- Avoid turning `GameScene` into the owner of every special-case combat rule.
- Preserve the simplicity of the current project while making content expansion cleaner for future scopes.
