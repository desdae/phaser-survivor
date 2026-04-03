import { describe, expect, it } from 'vitest';
import { getChoiceByIndex } from '../src/game/logic/upgradeSelection.js';

describe('getChoiceByIndex', () => {
  it('returns the indexed choice when it exists', () => {
    const choices = [{ key: 'damage' }, { key: 'heal' }, { key: 'pickupRadius' }];

    expect(getChoiceByIndex(choices, 1)).toEqual({ key: 'heal' });
  });

  it('returns null for an out of range index', () => {
    const choices = [{ key: 'damage' }];

    expect(getChoiceByIndex(choices, 3)).toBeNull();
  });
});
