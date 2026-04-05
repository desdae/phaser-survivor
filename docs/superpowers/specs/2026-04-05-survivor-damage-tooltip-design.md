# Survivor Damage Tooltip Design

## Goal

Upgrade the damage stats panel so hovering a learned weapon row shows a compact tooltip with that weapon's current learned modifiers and stat values. The tooltip should help the player understand how each weapon has evolved during the run without mixing in temporary buffs or noisy combat state.

## Scope

This spec covers:

- deriving per-weapon mini stat sheets from live permanent player stats
- hover behavior for the damage stats overlay
- tooltip layout and screen clamping
- focused regression coverage for weapon detail data and hover behavior

This spec does not change:

- damage or DPS calculation rules
- upgrade balance
- progression logic for earning upgrades
- temporary powerup behavior

## Desired Player Experience

The damage stats panel should stay lightweight by default, but become more informative when the player wants detail.

When the player hovers a weapon name in the panel:

- a tooltip appears next to that row
- the tooltip shows the weapon name
- the tooltip lists a short mini stat sheet of meaningful learned modifiers
- the tooltip disappears as soon as the pointer leaves the row or the panel is hidden

The tooltip should describe the weapon's permanent learned state only. Temporary powerups should not change the displayed values.

## Data Source And Ownership

The source of truth for tooltip values should be the current permanent `player.stats` object.

Use a dedicated weapon-detail builder in the logic layer to map a weapon key plus current player stats into a structured tooltip payload. That builder should:

- know which stats are relevant per weapon
- omit irrelevant or unset fields
- produce human-readable labels and formatted values

Examples of fields by weapon:

- `Auto Shot`: damage, cooldown, projectile count, pierce, ricochet, projectile speed
- `Orbiting Blade`: damage, blade count, orbit radius, orbit speed
- `Storm Lash`: damage, cooldown, chain links, jump range
- `Pulse Engine`: damage, cooldown, radius, echo count
- `Razor Boomerang`: damage, cooldown, boomerang count, range
- `Starcall`: damage, cooldown, meteor count, impact radius
- `Burst Rifle`: damage, cooldown, burst count
- `Flamethrower`: damage, cooldown, range
- `Rune Trap`: damage, cooldown, charges, blast radius, arm time if exposed
- `Piercing Lance`: damage, cooldown, range, width, pierce count if represented that way
- `Arc Mine`: damage, cooldown, trigger radius, chain count
- `Spear Barrage`: damage, cooldown, spear count, impact radius

`DamageStatsManager` should remain responsible only for total damage, DPS, and learned/unlocked weapon rows. It should not absorb tooltip formatting logic.

`GameScene` should bridge these two data sources:

1. request visible damage rows from `DamageStatsManager`
2. request tooltip payloads from the weapon-detail builder using `player.stats`
3. feed both into the overlay update path

## Overlay Behavior

`createDamageStatsOverlay()` in `overlayFactory.js` should be extended with:

- row bounds tracking for the visible weapon rows
- a small tooltip card anchored near the hovered row
- pointer hit-testing against row bounds

The tooltip should not rely on Phaser text-object hover handlers. Instead, use manual hit-testing against the overlay's fixed screen-space row rectangles, matching the project's more reliable pointer handling pattern.

Tooltip visibility rules:

- show only when the damage stats panel is visible
- show only for visible learned weapon rows
- hide when the pointer leaves the row
- hide when the panel toggles off
- hide when gameplay switches into another overlay state if the damage panel is no longer visible

## Tooltip Layout

The tooltip should be compact and readable:

- dark panel background with a light outline consistent with existing UI
- weapon name as the header
- 3-6 short stat rows underneath, depending on the weapon

Positioning rules:

- prefer opening to the left of the damage panel row
- if there is not enough room, clamp the tooltip on-screen
- vertically bias the tooltip to the hovered row while keeping the full panel visible

The tooltip should not scroll and should not include long prose descriptions.

## Formatting Rules

Tooltip values should be readable at a glance:

- integer-like values for damage/count/radius where appropriate
- compact decimal formatting for cooldowns or rates
- label/value rows only for meaningful learned stats

The overlay should never show filler rows for missing values. If a weapon is visible in the damage panel, its tooltip should contain only real current learned fields.

## Testing

Add focused regression coverage for:

- weapon-detail builder output for representative weapon types
- learned-only tooltip data behavior
- row hit-testing and tooltip visibility behavior in the damage overlay

The tests should lock in:

- correct mapping from live permanent stats to tooltip rows
- no tooltip data for locked weapons
- reliable hover behavior without depending on fragile Phaser pointer-over events

## Success Criteria

- Hovering a learned weapon in the damage stats panel shows a useful mini stat sheet.
- The tooltip reflects the weapon's permanent learned state, not temporary buffs.
- Locked or hidden weapons do not produce tooltips.
- The tooltip stays readable and on-screen.
- The damage panel remains stable and reliable with the added hover layer.
