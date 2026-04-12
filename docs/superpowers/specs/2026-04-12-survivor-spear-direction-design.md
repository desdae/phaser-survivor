# Survivor Spear Direction Visual Design

## Goal

Make both spear-themed abilities read as point-first attacks:

- `Spear Barrage` should have its sharp tip leading the falling direction
- `Lance` should upgrade from a plain line slash into a brief spear-shaped thrust with a visible spearhead at the front

The result should make both abilities feel physically directional instead of abstract or backwards-facing.

## Scope

This spec covers:

- correcting `Spear Barrage` spear orientation
- upgrading `Lance` visual presentation to a spearhead-led strike
- any generated textures needed to support those visuals
- focused regression coverage for direction/orientation behavior

This spec does not change:

- damage values
- cooldowns
- hitboxes or collision logic
- unlock progression
- audio

## Approved Direction

The visual direction is:

- spear tips must always point in the same direction the attack is traveling
- `Spear Barrage` keeps its current heavy diagonal sky-drop, warning ring, and shadow streak
- `Lance` remains a fast instant-feel attack, but should now read like a real spear thrust rather than a cyan beam

This is a readability and fantasy polish pass, not a broader rework of combat timing.

## Spear Barrage

### Desired Read

The barrage spear already has the right size and fall path, but its sharp end currently trails the motion. That makes the descent feel visually reversed.

After the fix:

- the metallic tip faces the landing zone
- the shaft trails behind the tip
- the shadow streak still supports the same trajectory
- the impact timing and target area remain exactly as they are now

### Rendering Approach

Do not redesign the barrage effect. Keep the current:

- warning ring
- falling spear sprite
- shadow streak
- impact burst

Only correct the orientation relationship between the sprite art and the applied runtime rotation so the spear points along the existing travel vector.

The cleanest path is to fix this in runtime rotation logic. If the generated texture orientation is easier to normalize at the source, that is also acceptable, but the external result must be the same: tip-first travel.

## Lance

### Desired Read

`Lance` currently renders as a simple bright line from the player outward. It communicates range, but not spear direction or weapon identity.

After the upgrade:

- the attack still feels immediate and piercing
- the front of the strike has a distinct spearhead
- the shaft or trailing streak extends behind that tip
- the thrust visually points along the attack vector
- the effect stays short-lived and readable during combat

### Rendering Approach

Upgrade `Lance` from a pure line effect into a lightweight spear-like strike visual:

- a narrow shaft or body
- a bright spearhead at the leading edge
- a faint trailing streak or glow behind it

The effect should remain brief, closer to a thrust flash than a persistent projectile. It should not become a second barrage or a large lingering sprite.

## Asset Strategy

Keep textures procedural and local to `GameScene.createTextures()`.

Expected texture support:

- continue using the existing barrage textures, with orientation corrected in use or generation
- add a dedicated `lance` strike texture if needed so the attack has a visible spearhead

Generated art should stay simple, high contrast, and readable at combat scale.

## Runtime Ownership

Keep ownership in the existing systems:

- `SpearBarrageManager` owns barrage visual rotation and strike lifecycle
- `LanceManager` owns the lance hit timing and thrust rendering

No new global visual system is needed.

For `Lance`, the manager should:

1. determine the attack direction exactly as today
2. render a short-lived spear-shaped strike aligned to that direction
3. destroy the visual quickly after the hit frame

This preserves current gameplay behavior while improving readability.

## Performance Constraints

These visuals must remain cheap:

- no long-lived spear sprites for lance
- no added per-frame complexity for lance beyond brief effect lifetime
- no extra allocations in barrage beyond the current strike visual structure
- no persistent pooled subsystem unless required by current scene patterns

This should remain a minor visual polish cost relative to normal combat updates.

## Testing

Add focused regression coverage for:

- `Spear Barrage` spear rotation pointing the tip along the travel vector
- `Lance` rendering a spear-oriented visual rather than only a plain line
- generated texture coverage for any new lance texture keys

Tests should verify direction and lifecycle, not artistic beauty.

## Success Criteria

- `Spear Barrage` visibly falls tip-first into the target area.
- `Lance` reads as a spear thrust instead of a generic beam.
- Both abilities now share a consistent point-first spear language.
- Combat timing and damage behavior remain unchanged.
