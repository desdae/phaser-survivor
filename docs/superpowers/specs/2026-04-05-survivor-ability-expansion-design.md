# Survivor Ability Expansion Design

Date: 2026-04-05

## Goal

Expand the arsenal with six new distinct abilities while keeping runs readable and build choices meaningful.

This pass adds:

- Burst Rifle
- Flamethrower
- Rune Trap
- Piercing Lance
- Arc Mine
- Spear Barrage

It also introduces a hard run cap of 8 total learned abilities, counting the starting `Auto Shot`.

## Scope

### New abilities

1. `Burst Rifle`
- Mouse-aimed.
- Fires a rapid burst of direct projectiles toward the live cursor.
- Upgrade lanes: damage, fire rate, burst count or spread tightening.

2. `Flamethrower`
- Mouse-aimed.
- Emits a short cone or spray in the cursor direction.
- Works as a close-range sustained damage weapon rather than a single projectile.
- Upgrade lanes: cone length, burn tick damage, uptime or cooldown pressure.

3. `Rune Trap`
- Places traps into the world that arm after a short delay.
- Triggered by enemies entering the armed zone.
- Upgrade lanes: arm speed, blast radius, stored charges.

4. `Piercing Lance`
- Mouse-aimed.
- Fires a penetrating beam/bolt that cuts through enemies in a line.
- Upgrade lanes: width, damage, pierce reach or cooldown.

5. `Arc Mine`
- Deploys a trigger mine that shocks a primary enemy, then jumps to nearby targets.
- Upgrade lanes: chain count, trigger radius, shock damage.

6. `Spear Barrage`
- Mouse-aimed to the cursor area.
- Calls down falling spears in a small target zone around the cursor.
- Upgrade lanes: spear count, impact radius, cooldown.

### Ability cap

- The player starts with `Auto Shot`.
- A run may contain at most 8 total learned abilities including `Auto Shot`.
- That means only 7 additional ability unlocks may be learned in a run.
- Once the cap is reached, no further unlock offers appear.
- Upgrade offers for already learned abilities remain available.

## Non-goals

- No meta-progression or account-wide unlock system.
- No full combat rewrite.
- No redesign of temporary powerups or chest rewards beyond making them respect the same unlock cap rules where relevant.

## Current arsenal model

Current learnable weapon families before this pass:

- Auto Shot
- Orbiting Blade
- Storm Lash
- Pulse Engine
- Razor Boomerang
- Starcall

After this pass, the global arsenal grows, but each run is capped at 8 learned abilities total.

## Design

### 1. Ability roster and ownership

Introduce a clearer roster concept in progression and runtime state.

Each ability has:

- an unlock key
- an owned/unlocked flag on player state
- one or more upgrade stats
- a matching damage stats key and label when it deals damage directly

The unlock layer must answer:

- how many abilities are currently learned
- whether another unlock can still appear
- whether a specific unlock should be hidden because the run already hit the cap

### 2. Mouse aim behavior

Mouse-aimed abilities always fire toward the live cursor world position during gameplay.

Rules:

- Cursor world position is tracked from the active camera each frame.
- Aim direction is derived from player position toward cursor world point.
- If the cursor is extremely close to the player, direction is normalized safely using a fallback so weapons do not jitter or emit invalid vectors.
- Mouse aim is always active during gameplay; no hold-to-aim mode is required.

### 3. Runtime architecture

Keep the current modular combat structure.

Recommended additions:

- Extend `Player` stats with unlock flags and upgradeable stat lanes for the six new abilities.
- Add a shared mouse-world-point property on `GameScene`.
- Add one manager per distinct behavior family when the runtime shape differs enough to justify it.

Expected runtime modules:

- `BurstRifleManager`
- `FlamethrowerManager`
- `RuneTrapManager`
- `LanceManager`
- `ArcMineManager`
- `SpearBarrageManager`

These managers should follow current system style:

- receive player, effective stats, time or delta, and enemy access
- own their own cooldown bookkeeping
- call back into `EnemyManager` for damage application
- stay additive to the existing run loop

### 4. Upgrade pool behavior

Unlock offers should be conditional on:

- ability not already owned
- ability cap not yet reached

Upgrade offers should be conditional on:

- ability already owned

Existing unlocks and future unlocks must all pass through the same ownership and cap rules.

### 5. Damage table behavior

Only learned abilities appear in the damage/DPS table.

New damage-capable abilities should register:

- their display label
- unlock time
- damage contributions

Non-owned abilities must never appear as zero rows.

### 6. Chest rewards and other unlock sources

Any reward source that can grant a new weapon-style unlock must also respect the 8-ability cap.

If a reward would try to unlock a new ability while capped, it must fall back to a valid owned-ability upgrade or another legal reward outcome.

## Player state additions

The player state should add unlock booleans and core stats for:

- burst rifle
- flamethrower
- rune trap
- piercing lance
- arc mine
- spear barrage

Each should have enough stats to support:

- unlock state
- damage
- cadence or cooldown
- one or two defining upgrade dimensions specific to that ability

## Manager responsibilities

### Burst Rifle

- Fires rapid projectiles at mouse direction.
- Can use the projectile path if that remains the most practical code path.
- Must feel distinct from Auto Shot through cadence and manual aim emphasis.

### Flamethrower

- Deals short-range directional damage in front of the player.
- Can be implemented through temporary flame segments, cone checks, or a lightweight directional spray model.
- Should favor sustained close-range pressure over precision.

### Rune Trap

- Places armed hazards in the world.
- Traps persist long enough to matter.
- Armed traps trigger reliably on enemy entry or proximity.

### Piercing Lance

- Delivers a directional line attack.
- Should clearly penetrate multiple enemies.
- Can be implemented as a very fast line projectile or code-driven line hit.

### Arc Mine

- Places or emits a mine that triggers and chains to nearby enemies.
- Must visually and mechanically differ from Storm Lash by centering on mine trigger behavior instead of immediate cast chaining.

### Spear Barrage

- Targets the cursor area.
- Spawns one or more delayed impact markers or falling strikes.
- Focuses on area denial and manual placement.

## UI and feedback

- Existing level-up overlay remains the upgrade surface.
- New unlock cards and upgrade cards must fit current card layout.
- Mouse-aimed abilities should be understandable from effects, not just text.
- Damage table expands with new ability labels only after unlock.

## Rules and constraints

- Total learned abilities in a run: 8 including Auto Shot.
- Live mouse aim is always used for mouse-aimed abilities.
- Existing weapons remain fully functional if the player never learns new ones.
- New systems should avoid turning `GameScene` into a special-case knot.

## Testing

Add focused coverage for:

- ability-cap filtering in progression
- owned-ability counting
- mouse-aimed direction resolution
- at least one runtime behavior test per new manager family
- damage table visibility for newly learned abilities only
- any reward-path fallback when unlock cap is reached

Verification should include:

- focused unit tests during implementation
- full `npm test`
- full `npm run build`

## Success criteria

- Six new abilities are available as unlocks and feel mechanically distinct.
- Mouse-aimed abilities reliably follow the live cursor world position.
- Runs never exceed 8 learned abilities total including Auto Shot.
- The upgrade pool remains readable because capped runs stop offering new unlocks.
- Only learned abilities appear in the damage table.
- The code stays modular enough to support further combat growth.
