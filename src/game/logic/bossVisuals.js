const NECROMANCER_LAYER_TEXTURE_KEYS = {
  aura: 'boss-necro-aura',
  eyes: 'boss-necro-eyes',
  chest: 'boss-necro-chest'
};

const NECROMANCER_OVERLAY_KEYS = Object.freeze(Object.values(NECROMANCER_LAYER_TEXTURE_KEYS));

const BOSS_LAYER_DEFS = {
  aura: {
    alpha: 0.34,
    depth: 4.45,
    key: NECROMANCER_LAYER_TEXTURE_KEYS.aura,
    phase: 0,
    pulseAlpha: 0.09,
    pulseScale: 0.035,
    scale: 1.34
  },
  eyes: {
    alpha: 0.82,
    depth: 4.6,
    key: NECROMANCER_LAYER_TEXTURE_KEYS.eyes,
    phase: 1.7,
    pulseAlpha: 0.08,
    pulseScale: 0.02,
    scale: 1
  },
  chest: {
    alpha: 0.58,
    depth: 4.55,
    key: NECROMANCER_LAYER_TEXTURE_KEYS.chest,
    phase: 3.1,
    pulseAlpha: 0.06,
    pulseScale: 0.02,
    scale: 0.98
  }
};

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

function getBossLayerState(definition, nowMs) {
  const pulse = Math.sin((nowMs ?? 0) / 220 + definition.phase);

  return {
    alpha: Math.max(0, Math.min(1, definition.alpha + pulse * definition.pulseAlpha)),
    scale: Math.max(0.01, definition.scale + pulse * definition.pulseScale)
  };
}

function applyBossLayer(enemy, sprite, definition, nowMs) {
  if (!sprite) {
    return;
  }

  const layerState = getBossLayerState(definition, nowMs);

  sprite.setPosition?.(enemy.x, enemy.y);
  sprite.setAlpha?.(layerState.alpha);
  sprite.setScale?.(layerState.scale);
  sprite.setVisible?.(enemy.active !== false);
}

function getBossLayerTextureKey(scene, key) {
  if (!scene?.textures?.exists) {
    return key;
  }

  return scene.textures.exists(key) ? key : key;
}

export function createBossVisualLayers(enemy, scene, nowMs = scene?.time?.now ?? 0) {
  if (!enemy) {
    return null;
  }

  enemy.visualState = updateBossVisualState(
    createBossVisualState(enemy.type ?? 'necromancerBoss', nowMs),
    'idle',
    nowMs
  );

  if (!scene?.add?.image) {
    return enemy.visualState;
  }

  enemy.auraSprite = scene.add.image(
    enemy.x,
    enemy.y,
    getBossLayerTextureKey(scene, BOSS_LAYER_DEFS.aura.key)
  );
  enemy.eyeGlowSprite = scene.add.image(
    enemy.x,
    enemy.y,
    getBossLayerTextureKey(scene, BOSS_LAYER_DEFS.eyes.key)
  );
  enemy.chestGlowSprite = scene.add.image(
    enemy.x,
    enemy.y,
    getBossLayerTextureKey(scene, BOSS_LAYER_DEFS.chest.key)
  );

  [
    [enemy.auraSprite, BOSS_LAYER_DEFS.aura],
    [enemy.eyeGlowSprite, BOSS_LAYER_DEFS.eyes],
    [enemy.chestGlowSprite, BOSS_LAYER_DEFS.chest]
  ].forEach(([sprite, definition]) => {
    sprite?.setOrigin?.(0.5, 0.5);
    sprite?.setDepth?.(definition.depth);
    sprite?.setVisible?.(enemy.active !== false);
    applyBossLayer(enemy, sprite, definition, nowMs);
  });

  return enemy.visualState;
}

export function updateBossVisualLayers(enemy, nowMs) {
  if (!enemy?.isBoss) {
    return;
  }

  const visualState =
    enemy.visualState ?? createBossVisualState(enemy.type ?? 'necromancerBoss', nowMs);

  if (visualState.mode !== 'idle' && nowMs >= visualState.untilMs) {
    enemy.visualState = updateBossVisualState(visualState, 'idle', nowMs);
  } else {
    enemy.visualState = visualState;
  }

  applyBossLayer(enemy, enemy.auraSprite, BOSS_LAYER_DEFS.aura, nowMs);
  applyBossLayer(enemy, enemy.eyeGlowSprite, BOSS_LAYER_DEFS.eyes, nowMs);
  applyBossLayer(enemy, enemy.chestGlowSprite, BOSS_LAYER_DEFS.chest, nowMs);
}

export function destroyBossVisualLayers(enemy) {
  enemy?.auraSprite?.destroy?.();
  enemy?.eyeGlowSprite?.destroy?.();
  enemy?.chestGlowSprite?.destroy?.();
  if (enemy) {
    enemy.auraSprite = null;
    enemy.eyeGlowSprite = null;
    enemy.chestGlowSprite = null;
    enemy.visualState = null;
  }
}

export function getBossVisualPresentation({ artAvailable, bossType, mode }) {
  const normalizedMode = normalizeMode(mode);
  const isNecromancerBoss = bossType === 'necromancerBoss';

  return {
    artAvailable: Boolean(artAvailable),
    bossType,
    fallbackSpriteKey: NECROMANCER_BOSS_ART_KEYS.idleFallback,
    layerTextureKeys: {
      ...NECROMANCER_LAYER_TEXTURE_KEYS
    },
    mode: normalizedMode,
    overlayKeys: [...NECROMANCER_OVERLAY_KEYS],
    spriteKey: isNecromancerBoss
      ? NECROMANCER_BOSS_ART_KEYS[normalizedMode]
      : NECROMANCER_BOSS_ART_KEYS.idleFallback
  };
}
