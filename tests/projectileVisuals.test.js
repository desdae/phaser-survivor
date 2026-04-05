import { describe, expect, it } from 'vitest';
import { getMagicMissileTextureSpec } from '../src/game/logic/projectileVisuals.js';

describe('getMagicMissileTextureSpec', () => {
  it('defines a compact magic missile recipe with a white core and purple burst spikes', () => {
    const spec = getMagicMissileTextureSpec();

    expect(spec.width).toBe(10);
    expect(spec.height).toBe(10);
    expect(spec.core).toEqual({
      color: 0xffffff,
      x: 5,
      y: 5,
      radius: 2.2,
      alpha: 0.98
    });
    expect(spec.glows).toHaveLength(2);
    expect(spec.spikes).toHaveLength(6);
    expect(spec.spikes.every((spike) => Array.isArray(spike.points) && spike.points.length === 6)).toBe(true);
    expect(spec.spikes.some((spike) => spike.color === 0x9f63ff)).toBe(true);
    expect(spec.spikes.some((spike) => spike.color === 0x6f2dff)).toBe(true);
  });
});
