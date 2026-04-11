# Necromancer Boss Art Redesign

Date: 2026-04-11

## Goal

Upgrade the Necromancer boss so it feels like a true centerpiece encounter instead of a scaled-up caster reuse. The new presentation should draw heavily from the provided reference: regal undead silhouette, horned crown, skull ornamentation, sickly green necrotic fire, layered robe motion, and dramatic magical presence.

This is a presentation pass only. Boss timing, mechanics, damage, hitboxes, reward flow, and journal behavior should remain mechanically compatible with the current encounter.

## Desired Outcome

The Necromancer should read as:

- a bespoke boss with a unique silhouette
- visually dominant and immediately recognizable on spawn
- readable at gameplay scale
- supported by restrained but dramatic dark-magic VFX
- consistent between the boss encounter and the journal portrait

The result should feel closer to a grim action-RPG boss than a normal survivor mob.

## Approach

Use a hybrid presentation stack built around illustrated imported/generated boss art:

1. A bespoke illustrated boss sprite sheet becomes the central body art.
2. Layered in-engine VFX provide glow, flame, aura, cast, summon, pulse, and death presentation.
3. Procedural fallback textures remain available so the game still runs even if art assets need iteration.

This gives the strongest visual payoff without forcing a full skeletal rig or a heavy real-time shader system across the whole game.

## Scope

### Included

- New bespoke Necromancer boss sprite sheet or equivalent imported/generated art
- Boss-specific animation states
- Layered green necrotic VFX for idle and attacks
- Updated boss portrait usage in the journal where practical
- Procedural fallback effects for missing art-driven layers
- Minimal visual-state wiring needed to synchronize attacks and animation

### Not Included

- Boss phase changes
- Boss mechanics rewrite
- New boss abilities beyond improved telegraph presentation
- Generic enemy art pipeline refactor for all enemies
- Full custom skeletal animation system

## Visual Direction

### Core silhouette

The boss should feel tall, narrow, and imposing:

- horned or crowned head silhouette
- broad spiked shoulders
- long tattered cloak/robes
- staff with an elevated flame source
- glowing focal points at eyes, chest, and casting hand

### Palette

Use:

- near-black robes and armor
- cool charcoal and desaturated bone
- muted metallic accents
- vivid necrotic green as the primary magical highlight
- small secondary violet/ashen shadows only where needed

The green should feel dangerous and supernatural, not cartoony.

### Readability rules

Because this is a top-down action game:

- the main silhouette must stay readable before any VFX
- glow should accent edges and focal points, not wash out the whole sprite
- attack overlays should be legible but not screen-filling
- the final on-screen composition should remain understandable during swarms

## Animation States

The Necromancer should have these visual states:

### Idle float

- subtle vertical hover/bob
- robe drift or trailing cloth motion
- pulsing eyes and chest gem
- staff lantern/flame flicker
- low-strength ground aura beneath the boss

### Cast state

Used for dark bolt volleys:

- one-hand or staff-forward casting emphasis
- short bright green flare before bolts launch
- stronger glow in hand/staff focus area

### Summon state

Used for undead summons:

- green necrotic burst around the boss
- brief skeletal smoke flare
- stronger ground aura pulse during summon

### Grave pulse state

Used for the anti-face-tank pulse:

- compact charge-up visual around the boss core
- fast sickly-green circular wave on release
- darker central flash to separate it from summon visuals

### Death state

- collapse or unraveling magical burnout
- green core flare followed by dimming
- robe/body fade or break into necrotic ash/smoke impression

## VFX Layers

### Persistent boss layers

These should exist most of the time:

- eye glow pulse
- chest core glow pulse
- staff-flame flicker
- hand-flame wisp layer
- faint ground aura / smoke pool

### Attack-specific layers

#### Dark Bolt Volley

- short cast flare at hand or staff
- stronger emissive pulse before projectile release
- dark-bolt projectile remains compatible with existing logic

#### Summon Dead

- circular green burst around the boss
- rising necrotic smoke/soul wisps
- stronger aura during the summon beat

#### Grave Pulse

- charge ring under/around boss
- sharp outward pulse ring
- brief flash timed to the damage event

## Technical Structure

### Visual seam

Add a dedicated boss visual seam instead of overloading the generic enemy visual helper. The boss should still be spawned and updated through the current encounter systems, but its richer visual state should be isolated enough to support future bosses.

Expected responsibilities:

- `EnemyManager`
  - owns boss behavior timing and state transitions
  - exposes current attack/cast visual state
  - creates and updates boss-specific effect handles as needed
- boss visual helper/module
  - maps boss states to animation frames, overlays, and timings
  - centralizes boss-specific art keys and effect config
- `GameScene.createTextures()`
  - generates procedural fallback effect textures only
  - does not become the sole source of final boss body art

### Asset model

The central boss body should come from imported or generated bitmap art, ideally a small state-based sprite sheet or a compact per-state frame set.

Fallback procedural support should exist for:

- glow mask
- summon burst
- grave pulse ring
- aura smoke
- any missing magical overlays

This allows the encounter to remain functional if art iteration is still in progress.

### Journal integration

Where practical, the journal should reuse the new boss art or a matching crop/portrait asset so the bestiary feels consistent with the encounter presentation.

## Implementation Constraints

- Keep gameplay logic unchanged unless minor state hooks are required to drive visuals
- Keep draw order explicit and stable
- Use pooled or very short-lived effects for attack visuals
- Avoid large particle spam
- Prefer lightweight tint/alpha/glow modulation before introducing broad custom shader complexity
- If a shader is used, restrict it to aura/emissive accent layers rather than the entire rendering stack

## Testing Strategy

Existing gameplay tests should stay valid. New coverage should focus on seams that matter for integration:

- boss visual-state transitions if extracted into pure helpers
- texture generation for any new fallback effect keys
- scene/runtime coverage that the boss art/effect keys exist and can be instantiated

This pass should avoid brittle pixel-assertion tests.

## Success Criteria

The redesign is successful when:

- the Necromancer is instantly recognizable as a boss on spawn
- the boss silhouette and magical focal points feel close to the reference direction
- idle, cast, summon, pulse, and death states are visibly distinct
- the journal portrait feels coherent with the in-game boss
- gameplay readability remains strong during swarms
- no meaningful performance regression appears during the encounter
