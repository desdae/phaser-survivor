import { describe, expect, it } from 'vitest';
import {
  createBossVisualState,
  getBossVisualPresentation,
  NECROMANCER_BOSS_ART_KEYS,
  updateBossVisualState
} from '../src/game/logic/bossVisuals.js';

describe('bossVisuals', () => {
  it('creates the idle necromancer state with the planned contract', () => {
    expect(createBossVisualState('necromancerBoss', 1200)).toEqual({
      bossType: 'necromancerBoss',
      effect: 'idleAura',
      mode: 'idle',
      untilMs: 1200
    });
  });

  it('applies the planned mode durations and explicit death end time', () => {
    const state = createBossVisualState('necromancerBoss', 1000);

    expect(updateBossVisualState(state, 'cast', 1000)).toEqual({
      bossType: 'necromancerBoss',
      effect: 'cast',
      mode: 'cast',
      untilMs: 1260
    });

    expect(updateBossVisualState(state, 'summon', 1300)).toEqual({
      bossType: 'necromancerBoss',
      effect: 'summon',
      mode: 'summon',
      untilMs: 1720
    });

    expect(updateBossVisualState(state, 'pulse', 1600)).toEqual({
      bossType: 'necromancerBoss',
      effect: 'pulse',
      mode: 'pulse',
      untilMs: 1820
    });

    const deathState = updateBossVisualState(state, 'death', 1900);
    expect(deathState.mode).toBe('death');
    expect(deathState.effect).toBe('death');
    expect(deathState.untilMs).toBe(2600);
  });

  it('maps the necromancer modes to usable main-sprite and layer keys', () => {
    const presentation = getBossVisualPresentation({
      artAvailable: true,
      bossType: 'necromancerBoss',
      mode: 'cast'
    });

    expect(NECROMANCER_BOSS_ART_KEYS).toMatchObject({
      idle: 'boss-necromancer-idle',
      cast: 'boss-necromancer-cast',
      summon: 'boss-necromancer-summon',
      pulse: 'boss-necromancer-pulse',
      death: 'boss-necromancer-death',
      portrait: 'boss-necromancer-portrait',
      idleFallback: 'boss-necromancer-fallback-idle'
    });

    expect(presentation).toEqual({
      artAvailable: true,
      bossType: 'necromancerBoss',
      mode: 'cast',
      layerTextureKeys: {
        aura: 'boss-necro-aura',
        chest: 'boss-necro-chest',
        eyes: 'boss-necro-eyes'
      },
      overlayKeys: ['boss-necro-aura', 'boss-necro-eyes', 'boss-necro-chest'],
      fallbackSpriteKey: NECROMANCER_BOSS_ART_KEYS.idleFallback,
      spriteKey: NECROMANCER_BOSS_ART_KEYS.cast
    });

    presentation.overlayKeys.push('mutated');

    expect(
      getBossVisualPresentation({
        artAvailable: false,
        bossType: 'necromancerBoss',
        mode: 'summon'
      })
    ).toEqual({
      artAvailable: false,
      bossType: 'necromancerBoss',
      mode: 'summon',
      layerTextureKeys: {
        aura: 'boss-necro-aura',
        chest: 'boss-necro-chest',
        eyes: 'boss-necro-eyes'
      },
      overlayKeys: ['boss-necro-aura', 'boss-necro-eyes', 'boss-necro-chest'],
      fallbackSpriteKey: NECROMANCER_BOSS_ART_KEYS.idleFallback,
      spriteKey: NECROMANCER_BOSS_ART_KEYS.summon
    });
  });
});
