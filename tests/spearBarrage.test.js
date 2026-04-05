import { describe, expect, it } from 'vitest';
import { SpearBarrageManager } from '../src/game/systems/SpearBarrageManager.js';

describe('SpearBarrageManager', () => {
  it('lands spear barrage hits in the cursor area after a short delay', () => {
    const hits = [];
    const manager = new SpearBarrageManager();
    const stats = {
      spearBarrageUnlocked: true,
      spearBarrageDamage: 18,
      spearBarrageCount: 2,
      spearBarrageRadius: 30,
      spearBarrageCooldownMs: 1200
    };
    const enemies = [{ active: true, x: 120, y: 100, id: 'target' }];

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1000, [], {
      damageEnemy: () => {}
    });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1240, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(hits.length).toBeGreaterThan(0);
  });
});
