function isEnemyInsideTrap(enemy, trap) {
  const dx = enemy.x - trap.x;
  const dy = enemy.y - trap.y;
  return dx * dx + dy * dy <= trap.radius * trap.radius;
}

export class RuneTrapManager {
  constructor(scene = null) {
    this.scene = scene;
    this.traps = [];
    this.availableCharges = null;
    this.rechargeQueue = [];
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (!stats.runeTrapUnlocked) {
      return false;
    }

    const maxCharges = Math.max(0, stats.runeTrapCharges ?? 0);
    this.syncCharges(maxCharges, now);

    if (this.availableCharges > 0 && this.traps.length < maxCharges) {
      this.placeTrap(cursorWorld, stats, now);
      this.availableCharges -= 1;
      this.rechargeQueue.push(now + (stats.runeTrapCooldownMs ?? 0));
    }

    let triggered = false;
    this.traps = this.traps.filter((trap) => {
      if (now < trap.armedAt) {
        return true;
      }

      const hitEnemy = (enemies?.enemies ?? enemies ?? []).find(
        (enemy) => enemy?.active && isEnemyInsideTrap(enemy, trap)
      );

      if (!hitEnemy) {
        return true;
      }

      enemyManager.damageEnemy(hitEnemy, trap.damage, 'runeTrap');
      triggered = true;
      this.renderDetonation(trap);
      trap.marker?.destroy?.();
      return false;
    });

    return triggered;
  }

  syncCharges(maxCharges, now) {
    if (this.availableCharges === null) {
      this.availableCharges = maxCharges;
    } else if (this.availableCharges > maxCharges) {
      this.availableCharges = maxCharges;
    }

    this.rechargeQueue = this.rechargeQueue.filter((readyAt) => {
      if (readyAt > now) {
        return true;
      }

      this.availableCharges = Math.min(maxCharges, this.availableCharges + 1);
      return false;
    });

    const pendingCapacity = Math.max(0, maxCharges - this.availableCharges);
    if (this.rechargeQueue.length > pendingCapacity) {
      this.rechargeQueue = this.rechargeQueue
        .sort((left, right) => left - right)
        .slice(0, pendingCapacity);
    }
  }

  placeTrap(cursorWorld, stats, now) {
    const marker = this.scene?.add?.image?.(cursorWorld.x, cursorWorld.y, 'rune-trap');
    marker?.setDepth?.(2);
    marker?.setAlpha?.(0.78);

    this.traps.push({
      armedAt: now + (stats.runeTrapArmMs ?? 0),
      damage: stats.runeTrapDamage ?? 0,
      marker,
      radius: stats.runeTrapRadius ?? 0,
      x: cursorWorld.x,
      y: cursorWorld.y
    });
  }

  renderDetonation(trap) {
    const burst = this.scene?.add?.image?.(trap.x, trap.y, 'rune-trap-burst');
    burst?.setDepth?.(2.2);
    burst?.setAlpha?.(0.92);
    burst?.setScale?.(0.7);

    this.scene?.tweens?.add?.({
      targets: burst,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.easeOut',
      scaleX: 1.45,
      scaleY: 1.45,
      onComplete: () => burst?.destroy?.()
    });
  }
}
