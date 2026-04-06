import { describe, expect, it } from 'vitest';
import { getCobbleWallTextureSpec } from '../src/game/logic/wallVisuals.js';

describe('getCobbleWallTextureSpec', () => {
  it('fills the full tile so adjacent wall sprites meet without transparent seams', () => {
    const spec = getCobbleWallTextureSpec();

    expect(spec.background).toEqual({
      alpha: 1,
      color: 0x4e4037,
      height: 32,
      width: 32,
      x: 0,
      y: 0
    });
    expect(spec.outerStroke).toEqual({
      alpha: 0.88,
      color: 0x241a15,
      height: 32,
      lineWidth: 2,
      width: 32,
      x: 0,
      y: 0
    });
  });
});
