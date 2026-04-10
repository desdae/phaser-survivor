import { describe, expect, it } from 'vitest';
import {
  BOSS_SPAWN_AT_MS,
  BOSS_WARNING_DURATION_MS,
  advanceBossEncounterState,
  consumeBossSpawn,
  createBossEncounterState
} from '../src/game/logic/bossEncounters.js';
import { BossSystem } from '../src/game/systems/BossSystem.js';

describe('bossEncounters', () => {
  it('triggers the necromancer warning at the fixed four minute mark', () => {
    const state = createBossEncounterState();

    advanceBossEncounterState(state, BOSS_SPAWN_AT_MS);

    expect(state.pendingBoss).toBe(true);
    expect(state.warningUntilMs).toBe(BOSS_SPAWN_AT_MS + BOSS_WARNING_DURATION_MS);
    expect(state.bossSpawned).toBe(false);
  });

  it('never retriggers once the boss has been spawned', () => {
    const state = createBossEncounterState();

    advanceBossEncounterState(state, BOSS_SPAWN_AT_MS);
    consumeBossSpawn(state);
    advanceBossEncounterState(state, BOSS_SPAWN_AT_MS + 90000);

    expect(state.pendingBoss).toBe(false);
    expect(state.bossSpawned).toBe(true);
  });
});

describe('BossSystem', () => {
  it('exposes warning and spawn state from elapsed gameplay time', () => {
    const system = new BossSystem();
    const first = system.update(BOSS_SPAWN_AT_MS);

    expect(first.pendingBoss).toBe(true);
    expect(system.isWarningActive(BOSS_SPAWN_AT_MS + 1000)).toBe(true);

    system.consumeSpawn();
    expect(system.state.bossSpawned).toBe(true);
  });
});
