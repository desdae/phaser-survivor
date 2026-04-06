import { describe, expect, it } from 'vitest';
import {
  POWERUP_COMPASS_EDGE_INSET,
  getPowerupCompassState
} from '../src/game/logic/powerupCompass.js';

describe('getPowerupCompassState', () => {
  const camera = {
    scrollX: 100,
    scrollY: 200
  };

  it('returns null when the powerup is already on screen', () => {
    expect(
      getPowerupCompassState(
        { active: true, x: 500, y: 500 },
        camera,
        1280,
        720
      )
    ).toBeNull();
  });

  it('clamps an off-screen powerup to the nearest screen edge', () => {
    const state = getPowerupCompassState(
      { active: true, x: 1700, y: 560 },
      camera,
      1280,
      720
    );

    expect(state.x).toBeCloseTo(1280 - POWERUP_COMPASS_EDGE_INSET, 5);
    expect(state.y).toBeGreaterThan(POWERUP_COMPASS_EDGE_INSET);
    expect(state.y).toBeLessThan(720 - POWERUP_COMPASS_EDGE_INSET);
    expect(state.angle).toBeGreaterThanOrEqual(0);
  });

  it('returns null for inactive pickups', () => {
    expect(
      getPowerupCompassState(
        { active: false, x: 1700, y: 560 },
        camera,
        1280,
        720
      )
    ).toBeNull();
  });
});
