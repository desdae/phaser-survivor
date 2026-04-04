# Survivor Elite Waves, Reward Chests, and Audio Design

## Goal

Add timed elite pressure spikes, mixed-reward chest moments, and a dark-fantasy procedural audio layer so runs gain stronger pacing, payoff, and moment-to-moment feedback without replacing the current endless survival loop.

## Scope

- Add elite waves on a fixed timer while normal enemies continue spawning.
- Add elite enemy presentation and stat boosts on top of existing enemy archetypes.
- Add chest drops from elite kills and a chest reward selection overlay.
- Add a mixed chest reward pool distinct from normal level-up rewards.
- Add short procedural dark-fantasy audio cues for core combat and progression events.
- Preserve the current one-scene Phaser architecture and existing input model.

## Non-Goals

- No full boss phase system yet.
- No biome or map landmark system yet.
- No authored audio asset pipeline; this pass uses procedural sound generation only.
- No meta-progression economy yet, though chest rewards should leave room for one later.

## Run Pacing

- Elite waves trigger every `90 seconds`.
- Elite waves do not pause or replace normal enemy spawns.
- When an elite wave triggers, the player should receive a short on-screen warning and an audio cue.
- The wave should spawn exactly one elite enemy on trigger.
- The elite can be based on any currently available enemy archetype, including spitters once they are in the spawn pool.
- After the elite is active, the run continues normally until that elite dies.
- When the elite dies, it always drops exactly one reward chest at its death location.

## Elite Enemy Rules

- Elites are promoted versions of existing enemy archetypes rather than brand-new behaviors.
- Elite enemies should retain their base movement and attack logic.
- Elites should have:
  - approximately `4x` base health
  - approximately `1.5x` contact damage
  - slightly increased XP payout
  - a larger scale than normal variants
  - a stronger tint, outline, or aura so they read instantly in the swarm
- Elite spitters should keep ranged behavior, but their projectile cadence should remain readable rather than becoming spammy.
- Elite enemies should be tracked explicitly so chest drops and audio events do not rely on guesswork.

## Reward Chest Rules

- Elite death spawns a chest pickup.
- The chest should remain in the world until collected.
- When the player touches the chest, gameplay pauses and a reward overlay opens.
- The chest reward overlay should match the interaction reliability of the level-up and restart overlays:
  - click support
  - keyboard support
  - scene-level pointer routing where needed
- The chest presents `3` choices and the player selects `1`.
- After the player picks a reward, the overlay closes and gameplay resumes.
- Chests are separate from level-ups; they should not consume level-up state or replace level-up rewards.

## Chest Reward Pool

Chest rewards should feel stronger or more special than a standard level-up pick. The initial pool should include:

- `Relic Upgrade`
  - offers a stronger-than-normal stat or weapon improvement
  - examples: larger projectile damage bump, larger cooldown reduction, stronger blade damage bump
- `Vital Surge`
  - restores a meaningful amount of HP
- `Soul Magnet`
  - instantly pulls nearby XP, hearts, and chest-adjacent pickups toward the player
- `Arsenal Draft`
  - prioritizes unlocking one still-locked weapon if any remain
  - falls back to a strong upgrade if all current weapons are already unlocked
- `Future Slot`
  - reserve one internal reward type slot so future gold or meta-currency can be added without redesigning chest flow
  - for this pass, it should safely fall back to an implemented reward instead of exposing incomplete content

## UI and Flow

- Add a short elite warning banner or callout near the HUD when an elite wave begins.
- Add a reward chest overlay using the existing overlay style and input pattern.
- The chest overlay should visually distinguish chest rewards from level-up choices.
- The HUD should continue updating correctly before and after chest pauses.
- Chest opening should not break the existing level-up pause flow, restart flow, or stats overlay toggle.
- If a chest would be collected during another paused state, collection should wait until gameplay resumes.

## Audio Direction

The audio pass should use a dark-fantasy tone with short, readable procedural sounds:

- enemy hit: low thud or flesh impact
- enemy death: rough splat or brittle crack
- elite warning: eerie pulse or alarm-like swell
- elite death: heavier, more dramatic impact
- chest spawn or chest open: occult sting or chime
- pickup collect: subtle brittle ping
- level up: restrained but satisfying rise
- player hurt: dull hit with urgency
- game over: heavier descending stab

## Audio Architecture

- Audio should be centralized in a dedicated manager rather than embedded directly inside combat logic.
- Systems should trigger simple named audio events instead of generating waveforms inline.
- Audio must degrade safely in browsers with autoplay restrictions:
  - initialize on first user interaction if needed
  - fail silently rather than breaking gameplay
- Sounds should be short enough to layer during combat without turning muddy.
- Volume should be tuned conservatively because many events can occur rapidly.

## Architecture

### GameScene

- Remains the central orchestrator.
- Wires together the elite wave system, chest reward system, and audio manager.
- Routes pointer and keyboard input into the chest overlay the same way it currently handles level-up and game-over overlays.
- Ensures pause and resume sequencing stays correct across:
  - level-up overlay
  - chest overlay
  - game-over overlay

### Elite Wave System

- Tracks elapsed time and the next elite trigger threshold.
- Raises a warning state when an elite wave begins.
- Requests one elite spawn without blocking normal spawn batches.
- Exposes enough state for HUD messaging and testing.

### EnemyManager

- Gains support for elite-promoted enemies.
- Applies stat multipliers and elite presentation on spawn.
- Emits elite death information so chest drops and audio triggers happen reliably.

### Chest Reward System

- Builds a filtered chest reward pool.
- Rolls `3` reward options per chest.
- Applies the chosen reward cleanly to player state and nearby pickups.
- Keeps chest rewards separate from level-up upgrade definitions to avoid muddy balance rules.

### Audio Manager

- Owns procedural sound generation and playback.
- Exposes semantic methods such as:
  - `playEnemyHit()`
  - `playEliteWarning()`
  - `playChestOpen()`
  - `playLevelUp()`
- Can be called from scene or systems without those callers needing to know waveform details.

## Data Flow

1. The run timer reaches the next elite threshold.
2. The elite wave system marks the wave active and raises a warning.
3. The scene or enemy manager spawns one elite enemy using an existing archetype plus elite modifiers.
4. Combat proceeds normally while the elite remains alive.
5. When the elite dies, the enemy manager reports the death as elite-specific.
6. A chest pickup spawns at the death location.
7. The player touches the chest.
8. Gameplay pauses and the chest reward overlay opens with `3` mixed rewards.
9. The selected reward applies to player state and/or nearby pickups.
10. Gameplay resumes and the next elite timer continues toward the following wave.

## Testing Requirements

- Elite waves trigger on the intended timer.
- Elite spawn state does not suppress normal spawning.
- Elite enemies receive the intended stat and presentation modifiers.
- Elite death always drops a chest.
- Chest collection pauses gameplay and offers exactly `3` rewards.
- Clicking and keyboard selection both work on the chest overlay.
- `Arsenal Draft` unlocks a locked weapon when one exists and falls back safely when none remain.
- `Soul Magnet` attracts nearby pickups immediately and predictably.
- Audio manager methods can be invoked safely even when audio context startup is restricted.
- Existing regression-sensitive flows still work:
  - level-up overlay selection
  - restart click handling
  - DPS tracking
  - projectile and enemy runtime flow during pause transitions

## Risks and Mitigations

- Pause-state overlap risk:
  - centralize overlay ownership in `GameScene` so level-up, chest, and game-over states do not compete.
- Reward overlap risk:
  - keep chest rewards in a separate module from standard progression upgrades.
- Audio spam risk:
  - throttle or vary repeated sounds and keep volumes conservative.
- Readability risk:
  - elite visual treatment should use scale plus tint or aura, not tint alone.

## Acceptance Criteria

- Runs now produce clear elite moments roughly every `90 seconds`.
- Elite kills reliably create a rewarding chest moment.
- Chest rewards feel distinct from normal level-up upgrades.
- Audio noticeably improves combat feel and progression readability.
- The implementation remains modular enough to support future bosses, map events, and meta rewards.
