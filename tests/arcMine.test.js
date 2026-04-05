import { describe, expect, it } from 'vitest';
import { ArcMineManager } from '../src/game/systems/ArcMineManager.js';

describe('ArcMineManager', () => {
  it('chains arc mine damage from the trigger target to a nearby second enemy', () => {
    const hits = [];
    const manager = new ArcMineManager();
    const stats = {
      arcMineUnlocked: true,
      arcMineDamage: 16,
      arcMineChains: 2,
      arcMineTriggerRadius: 20,
      arcMineChainRange: 32,
      arcMineCooldownMs: 900
    };
    const enemies = [
      { active: true, x: 8, y: 0, id: 'first' },
      { active: true, x: 24, y: 4, id: 'second' }
    ];

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1000, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(hits.map((hit) => hit.id)).toEqual(['first', 'second']);
  });
});
