import { describe, expect, it } from 'vitest';
import {
  ABILITY_JOURNAL_ORDER,
  ENEMY_JOURNAL_ORDER,
  buildAbilityJournalList,
  buildEnemyJournalList
} from '../src/game/logic/journalData.js';
import {
  createJournalDiscoveryState,
  discoverAbility,
  discoverEnemy,
  isAbilityDiscovered,
  isEnemyDiscovered
} from '../src/game/logic/journalDiscovery.js';

describe('journal discovery helpers', () => {
  it('tracks discovered enemies and abilities independently', () => {
    const state = createJournalDiscoveryState();

    discoverEnemy(state, 'basic');
    discoverAbility(state, 'projectile');

    expect(isEnemyDiscovered(state, 'basic')).toBe(true);
    expect(isEnemyDiscovered(state, 'spitter')).toBe(false);
    expect(isAbilityDiscovered(state, 'projectile')).toBe(true);
    expect(isAbilityDiscovered(state, 'meteor')).toBe(false);
  });
});

describe('buildEnemyJournalList', () => {
  it('returns discovered names and unknown placeholders in stable roster order', () => {
    const state = createJournalDiscoveryState();
    discoverEnemy(state, 'basic');

    const rows = buildEnemyJournalList(state);

    expect(rows.map((row) => row.key)).toEqual(ENEMY_JOURNAL_ORDER);
    expect(rows[0]).toMatchObject({ key: 'basic', discovered: true, label: 'Grave Runner' });
    expect(rows[1]).toMatchObject({ discovered: false, label: '???' });
  });
});

describe('buildAbilityJournalList', () => {
  it('returns learned names and unknown placeholders in stable roster order', () => {
    const state = createJournalDiscoveryState();
    discoverAbility(state, 'projectile');

    const rows = buildAbilityJournalList(state);

    expect(rows.map((row) => row.key)).toEqual(ABILITY_JOURNAL_ORDER);
    expect(rows[0]).toMatchObject({ key: 'projectile', discovered: true, label: 'Auto Shot' });
    expect(rows[1]).toMatchObject({ discovered: false, label: '???' });
  });
});
