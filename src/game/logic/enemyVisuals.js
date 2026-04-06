const ENEMY_VISUAL_VARIANTS = {
  skeleton: [
    {
      key: 'skeleton',
      frames: ['mob-skeleton-0', 'mob-skeleton-1', 'mob-skeleton-2'],
      frameDurationMs: 150,
      scale: 0.98
    }
  ],
  zombie: [
    {
      key: 'zombie',
      frames: ['mob-zombie-0', 'mob-zombie-1', 'mob-zombie-2'],
      frameDurationMs: 170,
      scale: 1
    }
  ],
  bat: [
    {
      key: 'bat',
      frames: ['mob-bat-0', 'mob-bat-1', 'mob-bat-2'],
      frameDurationMs: 120,
      scale: 1
    }
  ],
  tough: [
    {
      key: 'orc',
      frames: ['mob-orc-0', 'mob-orc-1', 'mob-orc-2'],
      frameDurationMs: 180,
      scale: 1.08
    },
    {
      key: 'ogre',
      frames: ['mob-ogre-0', 'mob-ogre-1', 'mob-ogre-2'],
      frameDurationMs: 210,
      scale: 1.16
    }
  ],
  spitter: [
    {
      key: 'necromancer',
      frames: ['mob-necromancer-0', 'mob-necromancer-1', 'mob-necromancer-2'],
      frameDurationMs: 190,
      scale: 1.04
    }
  ],
  poisonBlob: [
    {
      key: 'poisonBlob',
      frames: ['mob-poison-0', 'mob-poison-1', 'mob-poison-2'],
      frameDurationMs: 210,
      scale: 1.18
    }
  ],
  miniPoisonBlob: [
    {
      key: 'miniPoisonBlob',
      frames: ['mob-poison-0', 'mob-poison-1', 'mob-poison-2'],
      frameDurationMs: 190,
      scale: 0.82
    }
  ]
};

export function getEnemyVisualConfig(typeKey, spawnIndex = 0) {
  const variants = ENEMY_VISUAL_VARIANTS[typeKey] ?? ENEMY_VISUAL_VARIANTS.skeleton;
  const safeIndex = Math.abs(Math.trunc(spawnIndex)) % variants.length;

  return variants[safeIndex];
}

export function getAnimatedTextureKey(frames, now, frameDurationMs = 150) {
  if (!Array.isArray(frames) || frames.length === 0) {
    return null;
  }

  const frameIndex = Math.floor(Math.max(now, 0) / frameDurationMs) % frames.length;
  return frames[frameIndex];
}

export function advanceVisualFrame(enemy) {
  const frames = enemy.visualFrames ?? [];

  if (frames.length <= 1) {
    return frames[0] ?? enemy.texture?.key ?? null;
  }

  enemy.visualFrameIndex = ((enemy.visualFrameIndex ?? 0) + 1) % frames.length;
  return frames[enemy.visualFrameIndex];
}
