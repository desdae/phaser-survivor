# Survivor Flamethrower VFX Design

## Goal

Upgrade the flamethrower from a damage-only mechanic into a visually satisfying weapon by adding a directional fire stream effect with a bright flame body and a lighter smoke tail. The result should feel inspired by a real flamethrower blast while still reading clearly in a top-down survivor game.

## Scope

This spec only covers the flamethrower visual effect layer:

- procedural flame and smoke textures
- runtime rendering behavior for the flamethrower stream
- pooling/reuse strategy to keep the effect cheap
- minimal regression coverage for texture generation and any pure helper math

This spec does not change:

- flamethrower damage rules
- upgrade balance
- enemy reactions or burn debuffs
- audio behavior

## Visual Direction

The effect should read as a streaming jet rather than a static cone:

- a bright white-yellow core near the player/nozzle
- a turbulent orange flame body stretching toward the cursor
- darker orange breakup around the outer flame edges
- a lighter smoke tail that rides the rear and upper edge of the stream

The overall effect should stay readable against the grassy ground and dense swarms:

- flame should remain the dominant layer
- smoke should be secondary and partially transparent
- enemies and pickups must still be visible through the effect

## Rendering Approach

### Procedural Textures

`GameScene.createTextures()` will generate a small effect atlas:

- `flame-puff-0`
- `flame-puff-1`
- `flame-puff-2`
- `flame-smoke-0`

Each flame puff should be an irregular soft blob with:

- bright inner core
- orange mid-body
- darker orange edge fade
- slight asymmetric shape so repeated instances do not look stamped

The smoke puff should be:

- soft-edged
- gray-brown
- semi-transparent
- visually lighter than the reference image so it supports readability

### Runtime Stream

`FlamethrowerManager` will own the effect rendering because the visual is tightly coupled to weapon cadence and aim direction.

When the flamethrower deals damage on a firing tick:

- spawn several short-lived flame puffs along the current aim direction
- place them in a tapered line from the player outward
- make near puffs brighter and denser
- make far puffs larger and softer
- add slight lateral jitter so the stream feels turbulent instead of perfectly straight

Smoke behavior:

- spawn fewer smoke puffs than flame puffs
- bias smoke to the rear and upper part of the stream
- fade smoke more slowly than flame
- keep overall smoke alpha low enough that combat remains readable

## Pooling And Lifetime

The effect must avoid per-tick sprite churn.

`FlamethrowerManager` should keep small internal pools of reusable images:

- one pool for flame puffs
- one pool for smoke puffs

Each pooled visual should track:

- active/inactive state
- position
- scale
- rotation
- alpha
- expiry timestamp

Lifecycle rules:

- reuse inactive visuals before creating new ones
- only create more when the pool is exhausted
- deactivate visuals when their expiry time passes
- keep lifetimes short so the stream feels continuous without leaving clutter

Recommended ranges:

- flame lifetime: about `90-140ms`
- smoke lifetime: about `160-240ms`

## Data Flow

1. `GameScene` creates flame/smoke textures during scene boot.
2. `GameScene` constructs `FlamethrowerManager` with the scene reference.
3. `FlamethrowerManager.update()` evaluates flamethrower damage as it does today.
4. On a successful firing tick, the manager emits a burst of pooled flame and smoke visuals using the live mouse aim direction.
5. Each frame, the manager updates active effect visuals and returns expired ones to the pool.

This keeps the effect logic local to the weapon and avoids introducing a new shared particle system.

## Performance Constraints

The effect should be visually rich but bounded:

- only render visuals while the flamethrower actually fires
- keep the number of spawned puffs per tick modest
- reuse visuals through pooling
- avoid allocating large temporary arrays each update

This is especially important because the game already supports large enemy counts and the flamethrower may tick frequently in late runs.

## Testing

Add focused regression coverage for:

- any pure placement/helper math extracted from the manager
- texture generation for the new flame and smoke keys in `runtimeFlow.test.js`

Do not over-test rendering internals. The goal is to lock in:

- texture existence
- stable helper behavior
- no accidental removal of the effect assets

## Success Criteria

- The flamethrower visibly projects a living stream of flame toward the mouse cursor.
- The effect feels much closer to a true flamethrower blast than a simple damage cone.
- Smoke adds impact but does not hide enemies or pickups.
- Sustained flamethrower use does not introduce a noticeable performance drop.
- The implementation stays local to the flamethrower weapon path and does not complicate unrelated systems.
