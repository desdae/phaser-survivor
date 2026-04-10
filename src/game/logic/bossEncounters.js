export const BOSS_SPAWN_AT_MS = 240000;
export const BOSS_WARNING_DURATION_MS = 3500;

export function createBossEncounterState() {
  return {
    bossSpawned: false,
    bossDefeated: false,
    pendingBoss: false,
    warningUntilMs: -1
  };
}

export function advanceBossEncounterState(state, elapsedMs) {
  if (!state.bossSpawned && !state.pendingBoss && elapsedMs >= BOSS_SPAWN_AT_MS) {
    state.pendingBoss = true;
    state.warningUntilMs = elapsedMs + BOSS_WARNING_DURATION_MS;
  }

  return state;
}

export function consumeBossSpawn(state) {
  state.pendingBoss = false;
  state.bossSpawned = true;
  return state;
}

export function markBossDefeated(state) {
  state.bossDefeated = true;
  return state;
}
