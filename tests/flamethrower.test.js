import { describe, expect, it } from 'vitest';
import { FlamethrowerManager } from '../src/game/systems/FlamethrowerManager.js';

describe('FlamethrowerManager', () => {
  it('damages enemies inside the active flame cone only', () => {
    const hits = [];
    const manager = new FlamethrowerManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      flamethrowerUnlocked: true,
      flamethrowerDamage: 4,
      flamethrowerRange: 90,
      flamethrowerCooldownMs: 140,
      flamethrowerArcDeg: 60
    };
    const enemies = [
      { active: true, x: 40, y: 5, id: 'inside' },
      { active: true, x: -40, y: 5, id: 'behind' }
    ];

    manager.update(player, stats, { x: 1, y: 0 }, 1000, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(hits).toEqual([{ id: 'inside', damage: 4 }]);
  });
});
