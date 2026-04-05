export class FlamethrowerManager {
  constructor(scene = null) {
    this.scene = scene;
    this.nextTickAt = 0;
  }

  update(player, stats, aimDirection, now, enemies, enemyManager) {
    if (!stats.flamethrowerUnlocked || now < this.nextTickAt) {
      return false;
    }

    const maxAngle = ((stats.flamethrowerArcDeg ?? 0) * Math.PI) / 360;
    const maxDistance = stats.flamethrowerRange ?? 0;
    const hits = [];

    for (const enemy of enemies?.enemies ?? enemies ?? []) {
      if (!enemy?.active) {
        continue;
      }

      const dx = enemy.x - player.sprite.x;
      const dy = enemy.y - player.sprite.y;
      const distance = Math.hypot(dx, dy);

      if (!distance || distance > maxDistance) {
        continue;
      }

      const dot = (dx / distance) * aimDirection.x + (dy / distance) * aimDirection.y;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));

      if (angle <= maxAngle) {
        hits.push(enemy);
      }
    }

    if (hits.length === 0) {
      return false;
    }

    this.nextTickAt = now + (stats.flamethrowerCooldownMs ?? 0);
    hits.forEach((enemy) => enemyManager.damageEnemy(enemy, stats.flamethrowerDamage, 'flamethrower'));
    return true;
  }
}
