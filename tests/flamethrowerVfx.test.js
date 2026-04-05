import { describe, expect, it } from 'vitest';
import { buildFlameStreamPuffs } from '../src/game/logic/flamethrowerVfx.js';

describe('buildFlameStreamPuffs', () => {
  it('places flame puffs in a tapered line along the aim direction', () => {
    const puffs = buildFlameStreamPuffs(
      { x: 10, y: 20 },
      { x: 1, y: 0 },
      {
        flameCount: 4,
        jitter: 0,
        maxDistance: 80,
        smokeCount: 2,
        spread: 6
      },
      () => 0.5
    );

    expect(puffs.flames).toHaveLength(4);
    expect(puffs.flames[0].x).toBeGreaterThanOrEqual(10);
    expect(puffs.flames.at(-1).x).toBeGreaterThan(puffs.flames[0].x);
    expect(puffs.flames[0].scale).toBeLessThan(puffs.flames.at(-1).scale);
  });

  it('keeps smoke fewer and nearer the rear of the stream', () => {
    const puffs = buildFlameStreamPuffs(
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      {
        flameCount: 5,
        jitter: 0,
        maxDistance: 90,
        smokeCount: 2,
        spread: 8
      },
      () => 0.5
    );

    expect(puffs.smokes).toHaveLength(2);
    expect(puffs.smokes[0].y).toBeLessThan(puffs.flames.at(-1).y);
  });
});
