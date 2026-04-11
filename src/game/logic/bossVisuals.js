const NECROMANCER_OVERLAY_KEYS = ['boss-necro-aura', 'boss-necro-eyes', 'boss-necro-chest'];

export const NECROMANCER_BOSS_ART_KEYS = {
  idle: 'boss-necromancer-idle',
  cast: 'boss-necromancer-cast',
  summon: 'boss-necromancer-summon',
  pulse: 'boss-necromancer-pulse',
  death: 'boss-necromancer-death',
  portrait: 'boss-necromancer-portrait',
  idleFallback: 'boss-necromancer-fallback-idle'
};

const BOSS_VISUAL_DURATIONS_MS = {
  cast: 260,
  summon: 420,
  pulse: 220,
  death: 700
};

function normalizeMode(mode) {
  return mode === 'cast' || mode === 'summon' || mode === 'pulse' || mode === 'death'
    ? mode
    : 'idle';
}

export function createBossVisualState(bossType, nowMs) {
  return {
    bossType,
    effect: 'idleAura',
    mode: 'idle',
    untilMs: nowMs
  };
}

export function updateBossVisualState(state, mode, nowMs) {
  const normalizedMode = normalizeMode(mode);

  state.mode = normalizedMode;
  state.effect = normalizedMode === 'idle' ? 'idleAura' : normalizedMode;
  state.untilMs =
    normalizedMode === 'idle' ? nowMs : nowMs + (BOSS_VISUAL_DURATIONS_MS[normalizedMode] ?? 0);

  return state;
}

export function getBossVisualPresentation({ artAvailable, bossType, mode }) {
  const normalizedMode = normalizeMode(mode);
  const spriteKey =
    artAvailable && bossType === 'necromancerBoss'
      ? NECROMANCER_BOSS_ART_KEYS[normalizedMode]
      : NECROMANCER_BOSS_ART_KEYS.idleFallback;

  return {
    artAvailable: Boolean(artAvailable),
    bossType,
    mode: normalizedMode,
    overlayKeys: [...NECROMANCER_OVERLAY_KEYS],
    spriteKey
  };
}
