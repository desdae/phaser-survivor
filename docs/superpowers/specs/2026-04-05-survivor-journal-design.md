# Survivor Journal Design

## Goal

Add a codex-style journal opened with `J` that pauses the run and lets the player browse discovered enemies and learned abilities through a two-tab overlay.

## Scope

This first journal pass includes:

- a full-screen journal overlay
- `Enemies` and `Abilities` tabs
- a left-side list of entries with sprites and names
- a right-side detail panel with exact stats and descriptive text
- discovery gating with `???` placeholders
- pause and input integration with the existing overlay system

This pass does not include:

- keyboard navigation inside the journal
- scrolling with wheel or drag if the visible list fits without it
- lore unlock popups
- achievements or completion percentages

## User Experience

### Opening and closing

- Pressing `J` during active gameplay opens the journal.
- Opening the journal pauses the run completely.
- Pressing `J` again closes the journal and resumes gameplay.
- The journal does not open while the game-over overlay is active.
- The journal does not stack on top of level-up or chest overlays.

### Layout

The journal uses a full-screen overlay with:

- a top header containing tab buttons for `Enemies` and `Abilities`
- a left column containing the entry list
- a right detail panel containing the selected entry's information

The visual language should stay consistent with the existing overlays:

- dark blue-black panels
- pale text
- blue highlight accents
- clear selected-row state

### Enemies tab

The left panel shows one row per enemy journal slot:

- enemy sprite
- enemy name if discovered
- `???` if undiscovered

The right detail panel shows, for a discovered enemy:

- name
- enlarged sprite or representative sprite frame
- exact HP
- exact contact damage
- exact movement speed
- attack type
- exact attack range if relevant
- special abilities text
- short descriptive summary

For undiscovered enemies the detail panel shows:

- `???` title
- obscured or hidden stats
- placeholder description such as unknown threat text

### Abilities tab

The left panel shows one row per ability journal slot:

- representative icon or texture
- ability name if learned
- `???` if not learned

The right detail panel shows, for a learned ability:

- ability name
- short description
- exact core stats for that ability
- all possible upgrade paths for that ability
- exact per-upgrade gains

For unlearned abilities the detail panel shows:

- `???` title
- hidden stats
- hidden upgrade paths
- placeholder text indicating the technique has not been learned yet

## Discovery Rules

### Enemies

- Enemy entries become discovered the first time that enemy type is spawned in a run.
- Discovery should persist for the current session and future runs.
- Undiscovered enemy entries remain visible in the roster as `???`.

### Abilities

- Ability entries become discovered the first time that ability is learned.
- Discovery should persist for the current session and future runs.
- Undiscovered ability entries remain visible in the roster as `???`.
- Upgrade paths are only shown once the base ability is learned.

## Data Model

### Journal registries

Add two static registries:

- `enemyJournalEntries`
- `abilityJournalEntries`

These registries provide presentation content and journal ordering.

### Enemy entry fields

Each enemy journal entry should define:

- `key`
- `name`
- `textureKey`
- `stats`
- `attackType`
- `specialAbilities`
- `description`

The stats section should use exact values taken from live game tuning:

- `health`
- `contactDamage`
- `moveSpeed`
- `attackRange` where applicable
- `projectileDamage` where applicable
- `attackCooldownMs` where applicable

### Ability entry fields

Each ability journal entry should define:

- `key`
- `name`
- `iconKey`
- `description`
- `baseStats`
- `upgradePaths`

The journal should use exact live values for:

- base damage
- cooldown
- count
- radius
- range
- links
- width
- speed

depending on the ability type.

Upgrade path rows should include:

- upgrade label
- exact stat gain per pick

The journal should derive these values from the same gameplay definitions already used in code wherever practical, rather than duplicating upgrade math in unrelated places.

## Discovery state

Discovery state should live separately from the static registries.

It should track:

- discovered enemy keys
- discovered ability keys

The journal overlay reads:

- registry data for ordering and descriptions
- discovery state for visibility rules
- current game definitions for exact values

## Current content coverage

### Enemy roster

Initial enemy journal slots should cover the current enemy archetypes:

- basic swarm enemy
- tough bruiser enemy
- spitter enemy

The visual list row can use the representative current sprite frame for each archetype even if that archetype rotates through multiple visual variants in gameplay.

### Ability roster

Initial ability journal slots should cover the current arsenal:

- Auto Shot
- Orbiting Blade
- Storm Lash
- Pulse Engine
- Razor Boomerang
- Starcall
- Burst Rifle
- Piercing Lance
- Flamethrower
- Rune Trap
- Arc Mine
- Spear Barrage

## Input and pause flow

### Journal toggle

- `J` toggles the journal open and closed.
- Opening from active gameplay pauses physics and player action updates via the existing pause flow.
- Closing resumes gameplay only if no other pause overlay is active.

### Overlay priority

- Game over takes priority over the journal.
- Level-up and chest overlays take priority over the journal.
- Journal hover panels or selection logic should not leak through to the damage stats overlay beneath it.

### Pointer behavior

Journal pointer input should support:

- tab switching
- entry row selection
- optional close-by-toggle only for this first pass

The project has already had reliability issues with object-local pointer wiring, so the journal should use the same explicit pointer hit-testing style used by the fixed overlays.

## Architecture

### Overlay

Add a new `journalOverlay` alongside the existing overlays in `overlayFactory.js`.

It should own:

- tab state
- selected entry per tab
- row bounds for manual hit-testing
- rendering for list rows and detail panel

### Journal data helpers

Add a small logic layer for:

- journal registry definitions
- discovery-state helpers
- ability detail builder
- enemy detail builder

These helpers should keep `GameScene` from accumulating content-formatting code.

### Scene integration

`GameScene` should:

- register `J`
- maintain journal open/closed state
- maintain persistent discovery state
- mark enemies discovered when spawned
- mark abilities discovered when learned
- feed the journal overlay with the current tab data and detail payloads

## Persistence

Discovery should persist across restarts during the same page session.

For this pass, session persistence inside the running app is sufficient. If there is already a save/local-storage seam available, it can be used, but full permanent meta-save infrastructure is not required for this first implementation.

## Testing

Add focused tests for:

- enemy discovery fallback to `???`
- ability discovery fallback to `???`
- learned ability upgrade path visibility
- exact stat mapping for enemy entries
- exact stat and upgrade-path mapping for abilities
- journal overlay tab switching
- journal overlay row selection
- `J` toggle pause/resume routing in `GameScene`
- journal refusal to open during game over

## Success Criteria

The feature is complete when:

- pressing `J` opens a readable full-screen journal
- the run pauses while the journal is open
- `Enemies` and `Abilities` tabs both work
- undiscovered entries render as `???`
- discovered enemies show exact useful stats
- learned abilities show exact useful stats and all upgrade paths
- unlearned abilities hide upgrade paths
- the journal closes cleanly and gameplay resumes correctly
