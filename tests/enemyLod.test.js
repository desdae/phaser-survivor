import { describe, expect, it } from 'vitest';
import {
  ANIMATION_STEP_MS,
  FAR_UPDATE_INTERVAL,
  MID_UPDATE_INTERVAL,
  classifyEnemyTier,
  shouldAdvanceAnimation,
  shouldRefreshEnemyLogic
} from '../src/game/logic/enemyLod.js';

describe('classifyEnemyTier', () => {
  it('returns near for enemies inside the near band', () => {
    expect(classifyEnemyTier({ x: 40, y: 30 }, { x: 0, y: 0 })).toBe('near');
  });

  it('treats the near cutoff as near and the next pixel as mid', () => {
    expect(classifyEnemyTier({ x: 420, y: 0 }, { x: 0, y: 0 })).toBe('near');
    expect(classifyEnemyTier({ x: 421, y: 0 }, { x: 0, y: 0 })).toBe('mid');
  });

  it('returns mid for enemies outside the near band but not far away', () => {
    expect(classifyEnemyTier({ x: 520, y: 0 }, { x: 0, y: 0 })).toBe('mid');
  });

  it('treats the mid cutoff as mid and the next pixel as far', () => {
    expect(classifyEnemyTier({ x: 960, y: 0 }, { x: 0, y: 0 })).toBe('mid');
    expect(classifyEnemyTier({ x: 961, y: 0 }, { x: 0, y: 0 })).toBe('far');
  });

  it('returns far for distant enemies', () => {
    expect(classifyEnemyTier({ x: 1400, y: 0 }, { x: 0, y: 0 })).toBe('far');
  });
});

describe('shouldRefreshEnemyLogic', () => {
  it('always refreshes near enemies', () => {
    expect(shouldRefreshEnemyLogic('near', 10)).toBe(true);
  });

  it('gates mid and far enemies by cadence frame', () => {
    expect(shouldRefreshEnemyLogic('mid', 0)).toBe(true);
    expect(shouldRefreshEnemyLogic('mid', MID_UPDATE_INTERVAL)).toBe(true);
    expect(shouldRefreshEnemyLogic('mid', MID_UPDATE_INTERVAL + 1)).toBe(false);
    expect(shouldRefreshEnemyLogic('far', FAR_UPDATE_INTERVAL)).toBe(true);
    expect(shouldRefreshEnemyLogic('far', FAR_UPDATE_INTERVAL + 1)).toBe(false);
  });
});

describe('shouldAdvanceAnimation', () => {
  it('only advances when the current time reaches the next animation timestamp', () => {
    expect(shouldAdvanceAnimation(ANIMATION_STEP_MS - 1, ANIMATION_STEP_MS)).toBe(false);
    expect(shouldAdvanceAnimation(ANIMATION_STEP_MS, ANIMATION_STEP_MS)).toBe(true);
  });
});
