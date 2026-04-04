import { describe, expect, it } from 'vitest';
import { LanceManager } from '../src/game/systems/LanceManager.js';

describe('LanceManager', () => {
  it('damages multiple enemies along a piercing lance line', () => {
    const hits = [];
    const manager = new LanceManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      lanceUnlocked: true,
      lanceDamage: 20,
      lanceCooldownMs: 900,
      lanceLength: 220,
      lanceWidth: 18
    };
    const enemies = [
      { active: true, x: 90, y: 0, id: 'a' },
      { active: true, x: 150, y: 4, id: 'b' },
      { active: true, x: 80, y: 40, id: 'miss' }
    ];

    manager.update(player, stats, { x: 1, y: 0 }, 1000, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(hits).toEqual([
      { id: 'a', damage: 20 },
      { id: 'b', damage: 20 }
    ]);
  });
});
