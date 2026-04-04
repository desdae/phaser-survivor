import { describe, expect, it } from 'vitest';
import { getPlayerHealthBarState } from '../src/game/logic/playerHealthBar.js';

describe('getPlayerHealthBarState', () => {
  it('positions a small bar below the player and scales fill width by health ratio', () => {
    expect(getPlayerHealthBarState(120, 80, 100, 100)).toEqual({
      fillWidth: 24,
      frameHeight: 8,
      frameWidth: 28,
      fillHeight: 4,
      frameX: 106,
      frameY: 102,
      fillX: 108,
      fillY: 104
    });

    expect(getPlayerHealthBarState(120, 80, 75, 100).fillWidth).toBe(18);
    expect(getPlayerHealthBarState(120, 80, 85, 100).fillWidth).toBe(20);
  });

  it('clamps the health ratio safely between empty and full', () => {
    expect(getPlayerHealthBarState(120, 80, -5, 100).fillWidth).toBe(0);
    expect(getPlayerHealthBarState(120, 80, 120, 100).fillWidth).toBe(24);
    expect(getPlayerHealthBarState(120, 80, 50, 0).fillWidth).toBe(0);
  });
});
