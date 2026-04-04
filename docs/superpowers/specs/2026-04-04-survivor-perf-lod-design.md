# Survivor Perf LOD Design

## Goal

Push large-swarm performance much further by reducing simulation cost for distant enemies and trimming object churn, while preserving full-fidelity behavior near the player.

## Problem

The game currently holds high FPS through roughly the first `~1,000` threats, then falls off steadily and can reach roughly `~30 FPS` around `~1,500` threats. The current hot paths are no longer just local collision checks. The remaining pressure comes from:

- full enemy behavior updates every frame
- per-enemy animation frame selection every frame
- rebuilding large query structures at full crowd size
- transient object churn from short-lived projectiles and effects

Micro-optimizations alone are unlikely to sustain the target of `~180 FPS` at `~3,000` threats. The next pass needs simulation level-of-detail.

## Approach

Use `simulation LOD + pooled visuals`.

- Near enemies remain full-fidelity.
- Mid and far enemies update less often.
- Animation frame changes are cached and stepped on a coarse timer.
- Query structures focus on the near set.
- Short-lived objects are reused where possible.

This keeps the current game feel intact near the player and treats distance as the main budget lever.

## Runtime Design

### Enemy Simulation Tiers

Each enemy is classified by squared distance from the player:

- `near`: on-screen or close to the player; full update rate
- `mid`: moderately distant; reduced AI cadence
- `far`: distant/offscreen; sparse intent refresh

Initial target cadence:

- `near`: every frame
- `mid`: every `2-3` frames
- `far`: every `4-6` frames

The exact thresholds can be tuned, but the contract is stable: closer enemies get more CPU.

### Enemy Update Rules

In `EnemyManager`:

- Near enemies run full chase/spacing/attack logic each frame.
- Mid enemies refresh intent only on cadence ticks and otherwise continue using their previous velocity.
- Far enemies refresh very rarely, skip expensive spacing logic, and keep simple inward motion between refreshes.
- Spitter attack decisions only run at full fidelity when the enemy is near enough to matter.

This preserves threat accuracy near the player while making distant swarm mass cheap.

### Animation LOD

Enemy animation should stop doing frame-key resolution every tick.

Instead:

- each enemy stores its current animation frame index
- a shared scene or manager timer advances animation phases at a coarse interval
- texture swaps only happen when the frame index actually changes
- far enemies can animate at a reduced cadence compared with near enemies

The goal is to make animation cost proportional to visible/important motion, not total population.

### Enemy Query Strategy

The existing enemy query system should split responsibility:

- `nearQuery`: built from enemies in the near interaction band
- `full list`: retained only when absolutely needed

Combat systems that care about nearby targets should consume `nearQuery` by default:

- projectile ricochet
- orbiting blades
- boomerangs
- nova bursts
- meteor impact checks

This avoids paying full-crowd query costs for local combat effects.

### Object Pooling

The first pooling target is enemy projectiles.

- Reuse projectile instances instead of creating and destroying them constantly.
- Reset position, velocity, damage, and lifetime on reuse.
- Return inactive projectiles to the pool instead of destroying them.

If needed after that, the next pooling targets are:

- blood hit particles
- death splash particles

Pooling is explicitly about churn reduction, not behavior changes.

## Architecture Changes

### EnemyManager

`EnemyManager` becomes the owner of:

- distance tier classification
- cadence gating
- cached intent/velocity reuse
- shared near-query construction
- animation cadence stepping

This keeps crowd-performance logic centralized instead of spreading LOD decisions across weapon systems.

### Combat Helpers

`combat.js` gains or evolves helpers so systems can ask for:

- near enemies only
- capped nearby results
- local query traversal without rebuilding full scans

These helpers should remain generic enough to support future boss/minion systems.

### Projectile Pooling

`ProjectileManager` becomes responsible for lifecycle reuse of enemy or player transient projectile objects where practical, starting with enemy projectiles because they scale directly with threat count.

## Testing

Add focused regression coverage for:

- distance tier assignment by enemy position
- cadence gating for mid/far enemy logic
- animation frame advancement only on animation ticks
- near-query usage for local combat consumers
- projectile reuse from a pool instead of repeated creation

Keep the full existing suite green.

## Success Criteria

- Near-player combat feel remains unchanged.
- Far enemies continue moving inward without obvious freezing or popping.
- Animation still reads as alive, even if far enemies animate more sparsely.
- FPS dropoff after `~1,500` threats is much flatter than it is now.
- Performance is materially closer to the long-term target of `~180 FPS` at `~3,000` threats, even if one pass does not fully complete that journey.

## Non-Goals

- No full engine rewrite.
- No replacement of Phaser rendering with a custom renderer in this pass.
- No visible reduction in swarm fantasy near the player.
