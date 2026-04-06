import { describe, expect, it } from 'vitest';
import {
  ABILITY_JOURNAL_ORDER,
  ENEMY_JOURNAL_ORDER,
  buildAbilityJournalDetail,
  buildAbilityJournalList,
  buildEnemyJournalDetail,
  buildEnemyJournalList,
  buildJournalPayload
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

    discoverEnemy(state, 'skeleton');
    discoverAbility(state, 'projectile');

    expect(isEnemyDiscovered(state, 'skeleton')).toBe(true);
    expect(isEnemyDiscovered(state, 'spitter')).toBe(false);
    expect(isAbilityDiscovered(state, 'projectile')).toBe(true);
    expect(isAbilityDiscovered(state, 'meteor')).toBe(false);
  });
});

describe('buildEnemyJournalList', () => {
  it('returns discovered names and unknown placeholders in stable roster order', () => {
    const state = createJournalDiscoveryState();
    discoverEnemy(state, 'skeleton');

    const rows = buildEnemyJournalList(state);

    expect(rows.map((row) => row.key)).toEqual(ENEMY_JOURNAL_ORDER);
    expect(rows[0]).toMatchObject({ key: 'skeleton', discovered: true, label: 'Bone Walker' });
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

describe('buildEnemyJournalDetail', () => {
  it('builds exact enemy details for discovered entries', () => {
    const state = createJournalDiscoveryState();
    discoverEnemy(state, 'spitter');

    const detail = buildEnemyJournalDetail('spitter', state);

    expect(detail.title).toBe('Grave Spitter');
    expect(detail.rows).toContainEqual({ label: 'HP', value: '44' });
    expect(detail.rows).toContainEqual({ label: 'Damage', value: '10 projectile' });
    expect(detail.rows).toContainEqual({ label: 'Speed', value: '78' });
    expect(detail.rows).toContainEqual({ label: 'Attack', value: 'Ranged spit' });
  });

  it('hides undiscovered enemy details behind placeholders', () => {
    const detail = buildEnemyJournalDetail('tough', createJournalDiscoveryState());

    expect(detail.title).toBe('???');
    expect(detail.rows).toEqual([]);
    expect(detail.description).toMatch(/unknown/i);
  });
});

describe('buildAbilityJournalDetail', () => {
  it('builds learned ability details with exact upgrade paths', () => {
    const state = createJournalDiscoveryState();
    discoverAbility(state, 'meteor');

    const detail = buildAbilityJournalDetail('meteor', state, {
      meteorUnlocked: true,
      meteorDamage: 28,
      meteorRadius: 52,
      meteorCooldownMs: 2600,
      meteorCount: 1
    });

    expect(detail.title).toBe('Starcall');
    expect(detail.rows).toContainEqual({ label: 'Damage', value: '28' });
    expect(detail.rows).toContainEqual({ label: 'Radius', value: '52' });
    expect(detail.rows).toContainEqual({ label: 'Cooldown', value: '2600 ms' });
    expect(detail.upgradePaths).toContainEqual({ label: 'Falling Wrath', value: '+10 meteor damage' });
  });

  it('omits zero-only modifier rows that are marked as hidden when empty', () => {
    const state = createJournalDiscoveryState();
    discoverAbility(state, 'projectile');

    const detail = buildAbilityJournalDetail('projectile', state, {
      projectileDamage: 18,
      projectileSpeed: 440,
      fireCooldownMs: 520,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0
    });

    expect(detail.rows).toContainEqual({ label: 'Damage', value: '18' });
    expect(detail.rows.some((row) => row.label === 'Pierce')).toBe(false);
    expect(detail.rows.some((row) => row.label === 'Ricochet')).toBe(false);
  });

  it('keeps non-zero hidden rows when the modifier is actually learned', () => {
    const state = createJournalDiscoveryState();
    discoverAbility(state, 'projectile');

    const detail = buildAbilityJournalDetail('projectile', state, {
      projectileDamage: 18,
      projectileSpeed: 440,
      fireCooldownMs: 520,
      projectileCount: 1,
      projectilePierce: 2,
      projectileRicochet: 1
    });

    expect(detail.rows).toContainEqual({ label: 'Pierce', value: '2' });
    expect(detail.rows).toContainEqual({ label: 'Ricochet', value: '1' });
  });

  it('hides upgrade paths for unlearned abilities', () => {
    const detail = buildAbilityJournalDetail('chain', createJournalDiscoveryState(), {});

    expect(detail.title).toBe('???');
    expect(detail.upgradePaths).toEqual([]);
  });
});

describe('buildJournalPayload', () => {
  it('builds a journal payload with tab rows and the selected detail panel', () => {
    const state = createJournalDiscoveryState();
    discoverEnemy(state, 'skeleton');

    const payload = buildJournalPayload({
      activeTab: 'enemies',
      selectedByTab: {
        enemies: null,
        abilities: null
      },
      discoveryState: state,
      playerStats: {}
    });

    expect(payload.activeTab).toBe('enemies');
    expect(payload.enemies[0].label).toBe('Bone Walker');
    expect(payload.detail.title).toBe('Bone Walker');
  });
});
