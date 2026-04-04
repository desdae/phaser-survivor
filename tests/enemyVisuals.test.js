import { describe, expect, it } from 'vitest';
import { getAnimatedTextureKey, getEnemyVisualConfig } from '../src/game/logic/enemyVisuals.js';

describe('getEnemyVisualConfig', () => {
  it('cycles through varied fantasy looks for basic enemies', () => {
    expect(getEnemyVisualConfig('basic', 0).key).toBe('zombie');
    expect(getEnemyVisualConfig('basic', 1).key).toBe('skeleton');
    expect(getEnemyVisualConfig('basic', 2).key).toBe('bat');
    expect(getEnemyVisualConfig('basic', 3).key).toBe('zombie');
  });

  it('uses beefier looks for tough enemies and a caster look for spitters', () => {
    expect(getEnemyVisualConfig('tough', 0).key).toBe('orc');
    expect(getEnemyVisualConfig('tough', 1).key).toBe('ogre');
    expect(getEnemyVisualConfig('spitter', 0).key).toBe('necromancer');
  });
});

describe('getAnimatedTextureKey', () => {
  it('cycles through animation frames over time', () => {
    const frames = ['mob-zombie-0', 'mob-zombie-1', 'mob-zombie-2'];

    expect(getAnimatedTextureKey(frames, 0, 150)).toBe('mob-zombie-0');
    expect(getAnimatedTextureKey(frames, 160, 150)).toBe('mob-zombie-1');
    expect(getAnimatedTextureKey(frames, 320, 150)).toBe('mob-zombie-2');
    expect(getAnimatedTextureKey(frames, 480, 150)).toBe('mob-zombie-0');
  });
});
