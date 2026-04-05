import { describe, expect, it } from 'vitest';
import { RuneTrapManager } from '../src/game/systems/RuneTrapManager.js';

describe('RuneTrapManager', () => {
  it('arms a rune trap after a delay and triggers when an enemy steps inside', () => {
    const hits = [];
    const manager = new RuneTrapManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      runeTrapUnlocked: true,
      runeTrapDamage: 22,
      runeTrapArmMs: 400,
      runeTrapRadius: 40,
      runeTrapCharges: 1,
      runeTrapCooldownMs: 1
    };
    const enemy = { active: true, x: 10, y: 0, id: 'enemy' };

    manager.update(player, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
    manager.update(player, stats, { x: 32, y: 0 }, 1300, [enemy], {
      damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
    });
    manager.update(player, stats, { x: 32, y: 0 }, 1400, [enemy], {
      damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
    });

    expect(hits).toEqual([{ id: 'enemy', damage: 22 }]);
  });
});
