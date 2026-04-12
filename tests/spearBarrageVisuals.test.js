import { describe, expect, it } from 'vitest';
import {
  SPEAR_WARNING_MS,
  getSpearSpawnPosition,
  getSpearVisualState
} from '../src/game/logic/spearBarrageVisuals.js';

describe('spearBarrageVisuals', () => {
  it('uses the existing warning timing for barrage visuals', () => {
    expect(SPEAR_WARNING_MS).toBe(220);
  });

  it('starts the barrage spear above and left of the landing point for the approved diagonal fall', () => {
    const [x, y] = getSpearSpawnPosition(320, 240, {
      scrollY: 100,
      width: 800
    });

    expect(x).toBe(176);
    expect(y).toBe(-40);
  });

  it('moves the spear toward the target while scaling it down into the impact frame', () => {
    const strike = {
      landsAt: 1220,
      spawnX: 176,
      spawnY: -40,
      x: 320,
      y: 240
    };

    expect(getSpearVisualState(strike, 1000)).toMatchObject({
      x: 176,
      y: -40,
      progress: 0,
      scale: 1.18
    });

    expect(getSpearVisualState(strike, 1110)).toMatchObject({
      x: 248,
      y: 100,
      progress: 0.5,
      scale: 0.97
    });

    expect(getSpearVisualState(strike, 1220)).toMatchObject({
      x: 320,
      y: 240,
      progress: 1,
      scale: 0.76
    });
  });
});
