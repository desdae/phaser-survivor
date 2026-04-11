# Necromancer Boss Asset Contract

This folder documents the imported necromancer boss art keys and the procedural fallback keys that are generated in `GameScene.createTextures()` when a required boss texture is missing.

## Imported texture keys

- `boss-necromancer-idle`
- `boss-necromancer-idle-1`
- `boss-necromancer-idle-2`
- `boss-necromancer-cast`
- `boss-necromancer-summon`
- `boss-necromancer-pulse`
- `boss-necromancer-death`
- `boss-necromancer-portrait`

## Procedural generated keys

- `boss-necromancer-idle`
- `boss-necromancer-idle-1`
- `boss-necromancer-idle-2`
- `boss-necromancer-cast`
- `boss-necromancer-summon`
- `boss-necromancer-pulse`
- `boss-necromancer-death`
- `boss-necromancer-fallback-idle`
- `boss-necromancer-portrait`
- `boss-necro-aura`
- `boss-necro-eyes`
- `boss-necro-chest`
- `boss-necro-summon-burst`
- `boss-necro-pulse-ring`
- `boss-necro-death-burst`

## Contract notes

- The main boss sprite always targets the `boss-necromancer-*` mode keys. If imported art is absent, `GameScene.createTextures()` generates procedural fallback art into those same keys so the runtime contract still resolves.
- `boss-necromancer-fallback-idle` remains the last-resort idle fallback key for presentation lookup and tests, but the main sprite should normally resolve one of the mode keys above.
- `boss-necro-eyes` and `boss-necro-chest` are dedicated overlay layers for the boss eyes and chest glow. They should not silently degrade to `boss-necro-aura`.
- The procedural fallback keys are generated at the following sizes:
  - Main sprite modes and fallback idle: `72x92`
  - Portrait: `92x120`
  - Aura, eyes, chest, summon burst, and death burst: `96x96`
  - Pulse ring: `128x128`
