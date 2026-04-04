# Survivor Temporary Powerups Design

## Goal

Add rare temporary combat powerups that drop from enemies, stack cleanly, last 30 seconds, and temporarily juice all unlocked weapons without corrupting the player's permanent build progression.

## Scope

- Add a new temporary pickup category for combat buffs.
- Add three temporary buffs:
  - `frenzy`: all abilities get reduced cooldown
  - `overcharge`: all abilities get increased damage
  - `volley`: all abilities gain an equivalent extra projectile-style boost
- Powerups drop onto the ground and activate when collected.
- Buff stacks last 30 seconds each and expire independently.
- Add lightweight HUD visibility for active temporary buffs.

## Non-Goals

- No permanent relic or meta-progression layer.
- No new chest reward type tied to this feature.
- No rebalance pass on all existing upgrades beyond the temporary buff math introduced here.

## Drop Rules

- Standard enemies have a `1.5%` chance to drop a temporary powerup on death.
- Elite enemies have a `6%` chance to drop a temporary powerup on death.
- When a powerup drop succeeds, the buff type is chosen uniformly from the three buff types.
- Powerups spawn on the ground like hearts and XP orbs, using their own pickup visuals and `kind`.

## Buff Set

### Frenzy

- Effect: all abilities get `30%` reduced cooldown per active stack.
- Stacking rule: multiplicative on cooldown scalar.
- Example:
  - 1 stack -> cooldowns multiplied by `0.7`
  - 2 stacks -> cooldowns multiplied by `0.49`

### Overcharge

- Effect: all abilities get `40%` increased damage per active stack.
- Stacking rule: additive by stack count.
- Example:
  - 1 stack -> damage multiplied by `1.4`
  - 2 stacks -> damage multiplied by `1.8`

### Volley

- Effect: all abilities gain an equivalent extra projectile-style boost per active stack.
- Mapping:
  - base projectile weapon: `+1 projectileCount`
  - orbiting blade: `+1 bladeCount`
  - chain lightning: `+1 chainLinks`
  - nova pulse: `+1 novaEchoCount`
  - boomerang: `+1 boomerangCount`
  - meteor: `+1 meteorCount`

## Duration and Stacking

- Each collected powerup stack lasts `30000 ms`.
- Picking up the same buff twice creates two separate active stacks.
- Each stack stores its own `expiresAt`.
- Total effect for a buff type is based on the number of currently unexpired stacks.
- Expired stacks are removed automatically during gameplay update flow.
- Buff expiration must not pause or alter level-up or chest choice state beyond normal time-paused behavior.

## Architecture

### Temporary Buff System

Add a dedicated temporary buff system responsible for:

- accepting newly collected buff stacks
- expiring stacks by current scene time
- computing active stack counts by buff type
- producing an `effectiveStats` object from permanent player stats plus active temporary buffs
- exposing a compact HUD-friendly summary of active buffs

This system keeps temporary state separate from permanent progression and avoids per-weapon timer duplication.

### Player State Model

- `Player.stats` remains the source of permanent, level-up-driven build state.
- Temporary powerups do not mutate `Player.stats` directly.
- Weapon systems receive derived `effectiveStats` built from:
  - permanent `Player.stats`
  - active temporary buff stacks

### Pickup Flow

- Enemy death can roll a new powerup pickup in addition to existing orb/heart/chest rules.
- `PickupManager` spawns a pickup with:
  - `kind: 'powerup'`
  - `buffKey`
  - zero numeric value requirement unless useful for reuse
- `GameScene.handlePickupCollected` routes that pickup to the temporary buff system.

### Runtime Flow

Every gameplay update should:

1. expire old buff stacks using current scene time
2. build `effectiveStats`
3. run weapon managers against `effectiveStats`
4. update HUD buff display from the active buff summary

This keeps combat behavior responsive to buffs without rewriting each weapon around timer logic.

## Effective Stat Rules

The temporary buff system should compute a derived combat stat object with these adjustments:

- cooldown-bearing properties scaled by frenzy stacks:
  - `fireCooldownMs`
  - `chainCooldownMs`
  - `novaCooldownMs`
  - `boomerangCooldownMs`
  - `meteorCooldownMs`
- damage-bearing properties scaled by overcharge stacks:
  - `projectileDamage`
  - `bladeDamage`
  - `chainDamage`
  - `novaDamage`
  - `boomerangDamage`
  - `meteorDamage`
- volley stack bonuses applied to count-like properties:
  - `projectileCount`
  - `bladeCount`
  - `chainLinks`
  - `novaEchoCount`
  - `boomerangCount`
  - `meteorCount`

Guardrails:

- Effective values should stay numeric and valid even when a weapon is still locked.
- Locked weapons do not need special-case filtering in the buff system; existing unlocked checks remain the source of truth for whether a weapon actually runs.
- No cooldown should drop below a small positive floor if the runtime depends on that for safety.

## UI

Add a lightweight buff panel or HUD row showing active temporary buffs.

Display format should be compact and readable, such as:

- `Frenzy x2 24s`
- `Overcharge x1 17s`
- `Volley x3 9s`

Rules:

- Show one row per active buff type.
- Stack count is the number of active stacks for that buff type.
- Timer shown is the soonest-expiring stack for that buff type.
- Hidden when there are no active temporary buffs.

## Audio and Feedback

- Powerup pickups should use the existing pickup feedback path unless a distinct sound is already cheap to add during implementation.
- Pickup visuals should be clear enough to distinguish the three buff types at a glance.
- The drop should feel rare and exciting, not visually confused with hearts or XP.

## Testing Strategy

Add coverage for:

- drop roll behavior and elite-vs-normal drop chances
- independent stack expiration
- effective stat derivation for cooldown, damage, and volley mappings
- pickup collection routing for `powerup` kind
- HUD summary formatting or panel update behavior
- no permanent stat corruption after stacks expire

## Success Criteria

- Temporary powerups drop rarely but regularly enough to matter in longer runs.
- Buff stacks can overlap and expire independently without bugs.
- All weapons clearly respond to active buffs.
- Player progression remains permanent while buffs remain temporary.
- The HUD communicates active buffs clearly without cluttering core combat information.
