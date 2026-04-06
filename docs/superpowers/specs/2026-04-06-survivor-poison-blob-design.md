# Poison Blob Enemy Design

## Overview

Add a new slow, high-health poison enemy that changes battlefield control instead of acting like another direct chaser. The poison blob should ooze forward, leave a hazardous trail behind it, and split into two smaller poison blobbies when killed. The result should feel like a fat swamp hazard that reshapes movement lanes rather than simply adding more melee pressure.

## Goals

- Add a new distinct enemy archetype: `poisonBlob`
- Give it strong visual identity through bubbling/sloshing animation and poison trail hazards
- Make it tactically different from current enemies by controlling space through lingering poison
- On death, split into two lesser poison blobs that do not split further
- Keep the implementation compatible with existing enemy spawning, damage, mitigation, and journal systems

## Player-Facing Behavior

### Main Poison Blob

- Very slow movement
- High HP
- Fat/larger body and hit radius
- Leaves poison puddles as it moves
- Direct contact still hurts, but the trail is the defining threat
- When killed, splits into two smaller poison blobbies

### Mini Poison Blob

- Smaller than the parent
- Lower HP and lower contact damage
- Slightly faster than the parent
- Can still leave poison behind if desired for identity consistency, but does **not** split on death

### Poison Trail

- Spawned periodically behind living poison blobs
- Each puddle lasts `5 seconds`
- Damages the player repeatedly while standing inside
- Poison tick damage is intentionally lower than direct contact damage
- Damage should tick at a controlled interval, not every frame

## Recommended Initial Balance

### poisonBlob

- `maxHealth: 96`
- `speed: 42`
- `contactDamage: 10`
- `poisonTickDamage: 2`
- `trailDropIntervalMs: 650`
- `hitRadius`: large, clearly bigger than other small mobs

### miniPoisonBlob

- `maxHealth: 28`
- `speed: 60`
- `contactDamage: 6`
- `poisonTickDamage: 1`
- `canSplit: false`

### Spawn Timing

- Main `poisonBlob` enters the spawn profile in midgame, not immediately
- Suggested initial unlock timing: around `75-90 seconds`
- Initial weight should stay low so it feels notable rather than common spam

## Architecture

### Enemy Definitions

Add two explicit enemy types in `EnemyManager`:

- `poisonBlob`
- `miniPoisonBlob`

Only `poisonBlob` appears in standard spawn weights. `miniPoisonBlob` is created only from parent death splits.

### Enemy Lifecycle

When a main poison blob dies:

- spawn two mini poison blobs near the death location with small positional offsets
- mark them so they never split again

This split should happen inside the normal enemy death flow so XP, effects, and damage reporting remain consistent.

### Poison Hazard Management

Keep poison hazard management near enemy logic rather than introducing a large separate system on the first pass.

Responsibilities:

- track active poison puddles
- spawn puddles behind poison blobs at interval
- expire puddles after `5 seconds`
- tick player poison damage while overlapping active puddles

Poison damage must go through `player.takeDamage()` so mitigation upgrades continue to apply correctly.

### Visuals

#### Blob Visuals

Add a bubbling/sloshing green blob visual in `enemyVisuals.js` and `GameScene.createTextures()`:

- glossy toxic green surface
- uneven wobbling silhouette
- bubble highlights
- darker toxic core

The mini blob should reuse the same visual family at smaller scale.

#### Poison Puddle Visuals

Add a distinct poison trail texture:

- bright sickly green rim
- darker interior
- semi-transparent toxic ooze look
- not too large, since many may exist at once

## Journal Integration

Only the main `poisonBlob` should appear in the journal roster for now.

Its entry should show:

- exact HP
- exact contact damage
- exact speed
- attack type
- special ability summary
- description mentioning the death split into two lesser poison blobbies

`miniPoisonBlob` remains an implementation detail and does not need a separate codex entry in this pass.

## Spawn and Encounter Design

The poison blob should complement the roster by adding space denial:

- skeletons and bats pressure direct movement
- zombies and tough enemies clog paths
- spitters punish distance and standoff positioning
- poison blobs dirty up the ground and make route planning worse over time

This should make them feel unique without replacing the roles of existing enemies.

## Performance Guardrails

- Use pooled or capped poison puddles if needed
- Keep puddle lifetimes fixed at `5 seconds`
- Use interval-based trail spawning, not per-frame spawning
- Use interval-based poison damage ticking, not per-frame overlap damage
- Avoid recursive splitting beyond the single parent -> two children step

## Testing Requirements

Add coverage for:

- parent blob splitting into two children
- child blob not splitting further
- poison puddle spawn timing
- poison puddle expiration after `5 seconds`
- repeated poison damage ticking while player stands in poison
- spawn profile unlock timing/weights
- journal detail content for the poison blob

## Success Criteria

- The poison blob feels visually and mechanically distinct from existing enemies
- Its trail changes movement decisions in a noticeable way
- The split-on-death behavior works reliably and only once
- Poison damage respects the game’s normal damage path
- The journal accurately documents the new enemy
- The feature performs cleanly during dense runs
