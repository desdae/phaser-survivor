export const ELITE_WAVE_INTERVAL_MS = 90000;
export const ELITE_WARNING_DURATION_MS = 3000;

export function createEliteState() {
  return {
    nextEliteAtMs: ELITE_WAVE_INTERVAL_MS,
    pendingElite: false,
    warningUntilMs: -1
  };
}

export function advanceEliteWaveState(state, elapsedMs) {
  if (!state.pendingElite && elapsedMs >= state.nextEliteAtMs) {
    state.pendingElite = true;
    state.warningUntilMs = elapsedMs + ELITE_WARNING_DURATION_MS;
    state.nextEliteAtMs = (Math.floor(elapsedMs / ELITE_WAVE_INTERVAL_MS) + 1) * ELITE_WAVE_INTERVAL_MS;
  }

  return state;
}

export function consumePendingElite(state) {
  state.pendingElite = false;
  return state;
}

export function getEliteModifiers() {
  return {
    healthMultiplier: 10,
    contactDamageMultiplier: 1.5,
    xpMultiplier: 1.6,
    scaleMultiplier: 1.5,
    tint: 0xf4bf63
  };
}
