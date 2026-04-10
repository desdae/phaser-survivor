# Survivor Boss Encounters Design

Date: 2026-04-10

## Goal

Add a first-pass boss encounter system to the run without disrupting the existing elite-wave, chest, journal, or pause-overlay flow. The first boss should feel like a real centerpiece encounter, not just a stronger elite.

The first boss will be a bespoke `Necromancer` fight that appears at a fixed time and uses its own attack pattern mix, health presentation, and reward moment.

## Scope

This pass adds:

- one fixed-time boss encounter at `4:00`
- one bespoke boss: `Necromancer`
- boss warning and boss health HUD
- boss attacks built around projectiles, summoning, and a proximity pulse
- boss discovery/journal support
- boss reward flow on death

This pass does not add:

- multiple bosses
- boss phase changes
- a generalized multi-boss content pipeline
- removal or replacement of elite waves

## Player Experience

- Elite waves still occur as they do now.
- At `4:00`, the run announces a boss encounter with a more dramatic warning than elite warnings.
- A `Necromancer` enters from off-screen and becomes the focus of the run.
- The boss pressures the player through:
  - dark projectile volleys
  - small summoned undead packs
  - a close-range grave pulse that discourages standing on top of it
- The boss has a dedicated HP bar and name, clearly separating it from normal mobs and elites.
- On death, the boss grants a stronger reward moment than a standard elite.

## Encounter Structure

### Trigger

- The boss encounter triggers at exactly `4:00` elapsed gameplay time.
- It should trigger once per run.
- The encounter should not fire while gameplay is paused.
- If the player dies before `4:00`, no boss appears.

### Spawn

- The Necromancer spawns near the edge of the current camera view.
- Spawn placement should avoid appearing directly on top of the player.
- The boss should have a clear entrance moment that follows the warning.

### Reward

- Killing the boss should result in a guaranteed strong reward.
- The first pass can reuse the existing reward chest flow if that is the lowest-risk integration point.
- The boss reward should remain distinct in messaging and feel from a normal elite kill, even if the pickup flow reuses the chest overlay.

## Boss Identity: Necromancer

### Combat Role

The Necromancer is a ranged pressure boss. It should not feel like a larger melee brute. Its identity comes from battlefield control and sustained pressure through spells and summons.

### Baseline Characteristics

- high HP compared with elites
- low-to-moderate contact threat
- prefers medium range
- attacks through spells and minions

### First-Pass Mechanics

#### Dark Bolt Volley

- Fires a projectile volley aimed at the player.
- The attack should be threatening but dodgeable.
- It should feel visually distinct from current spitter attacks.

#### Summon Dead

- Periodically summons a small pack of undead near the boss.
- Summons should be bounded and readable.
- The summon cadence should add pressure without overwhelming performance or burying the fight in pure trash volume.

#### Grave Pulse

- Emits a short-range pulse around the boss.
- The purpose is to punish face-tanking and encourage spacing.
- This should not be a huge arena-wide attack.

## Architecture

### Encounter Layer

Add a dedicated boss encounter state path instead of stuffing everything into elite-wave logic.

This can be implemented as a focused `BossSystem` or similarly scoped state manager responsible for:

- fixed-time trigger state
- warning window
- one-time spawn guarantee
- boss active/dead state

Elite waves remain separate and continue to use the existing elite wave system.

### GameScene Responsibilities

`GameScene` should:

- advance the boss encounter timer from gameplay time
- trigger boss warning UI/audio
- ask the enemy layer to spawn the boss
- refresh boss HUD presentation
- route boss death into the reward flow

### Enemy / Boss Runtime Responsibilities

The enemy runtime should:

- define the Necromancer as a true enemy type
- update boss-specific cooldowns and attacks
- manage boss summons
- maintain boss HP data and cleanup
- notify reward/death flow

Boss behavior can live in `EnemyManager` for the first pass if the implementation stays clearly isolated by boss type. If it starts to tangle normal enemy updates, extract a dedicated boss behavior helper.

### HUD and UI

Add a dedicated boss HUD path:

- boss name
- boss health bar
- strong visibility
- clean coexistence with the normal HUD, elite state, and overlays

The boss HUD should disappear immediately and cleanly on death.

## Journal Integration

Add a `Necromancer` journal entry.

Discovery rule:

- discovered on first spawn

The entry should include:

- exact HP
- contact damage
- movement speed
- attack type
- special abilities:
  - Dark Bolt Volley
  - Summon Dead
  - Grave Pulse
- a short descriptive blurb

## Suggested Numbers

These are first-pass tuning targets, not rigid final values:

- HP: `1400-1800`
- contact damage: lower than a melee brute boss
- projectile cadence: threatening but dodgeable
- summon cadence: periodic and controlled
- grave pulse radius: short-range punishment zone

Exact values should be tuned during implementation to preserve readability and fairness.

## Constraints and Guardrails

- exactly one boss encounter in this pass
- exactly one boss type in this pass
- no boss phases yet
- no replacement of elite waves
- no unbounded summon spam
- no new pause/overlay conflicts
- boss logic must not destabilize the current combat loop or reward flow

## Testing

Add or update tests to cover:

- fixed-time trigger at `4:00`
- single-spawn guarantee
- warning-to-spawn flow
- boss attacks running on cadence
- summon behavior staying bounded
- boss HUD creation, updates, and cleanup
- reward flow on death
- journal discovery/data integration

Verification must include:

- `npm test`
- `npm run build`

## Implementation Notes

- Reuse existing systems where it keeps risk low:
  - warning overlays
  - reward chest flow
  - journal data wiring
- Prefer isolated helpers for boss timing and boss attack cadence rather than scattering boss-only checks across unrelated gameplay systems.
- Keep the first pass narrow and polished so future bosses can build on a stable seam.
