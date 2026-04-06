import { buildLightningBoltSegments } from '../logic/chain.js';

const ARC_MINE_ARM_MS = 160;

function getDistanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function getNearestEnemyInRange(origin, enemies, maxDistance, excludedIds = new Set()) {
  const maxDistanceSq = maxDistance * maxDistance;
  let best = null;
  let bestDistanceSq = maxDistanceSq;

  for (const enemy of enemies ?? []) {
    if (!enemy?.active || excludedIds.has(enemy.id)) {
      continue;
    }

    const distanceSq = getDistanceSq(origin, enemy);

    if (distanceSq <= bestDistanceSq) {
      best = enemy;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

export class ArcMineManager {
  constructor(scene = null) {
    this.scene = scene;
    this.nextCastAt = 0;
    this.pendingMines = [];
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (!stats.arcMineUnlocked) {
      return false;
    }

    const liveEnemies = enemies?.enemies ?? enemies ?? [];
    let placedMine = false;

    if (now >= this.nextCastAt) {
      const seededTarget = getNearestEnemyInRange(
        cursorWorld,
        liveEnemies,
        stats.arcMineTriggerRadius ?? 0
      );

      if (seededTarget) {
        this.placeMine(cursorWorld, stats, now);
        this.nextCastAt = now + (stats.arcMineCooldownMs ?? 0);
        placedMine = true;
      }
    }

    let detonatedMine = false;
    this.pendingMines = this.pendingMines.filter((mine) => {
      if (mine.detonateAt > now) {
        return true;
      }

      this.detonateMine(mine, stats, liveEnemies, enemyManager);
      detonatedMine = true;
      return false;
    });

    return placedMine || detonatedMine;
  }

  placeMine(cursorWorld, stats, now) {
    const marker = this.scene?.add?.image?.(cursorWorld.x, cursorWorld.y, 'arc-mine');

    marker?.setDepth?.(2.2);
    marker?.setScale?.(0.82);
    marker?.setAlpha?.(0.92);

    this.scene?.tweens?.add?.({
      alpha: 0.72,
      duration: ARC_MINE_ARM_MS,
      scaleX: 1.02,
      scaleY: 1.02,
      targets: marker,
      yoyo: true
    });

    this.pendingMines.push({
      chainRange: stats.arcMineChainRange ?? 0,
      damage: stats.arcMineDamage ?? 0,
      detonateAt: now + ARC_MINE_ARM_MS,
      marker,
      maxHits: Math.max(1, stats.arcMineChains ?? 1),
      triggerRadius: stats.arcMineTriggerRadius ?? 0,
      x: cursorWorld.x,
      y: cursorWorld.y
    });
  }

  detonateMine(mine, stats, enemies, enemyManager) {
    const hitIds = new Set();
    const targets = [];
    let current = getNearestEnemyInRange(mine, enemies, mine.triggerRadius, hitIds);

    while (current && targets.length < mine.maxHits) {
      targets.push(current);
      hitIds.add(current.id);
      enemyManager.damageEnemy(current, mine.damage, 'arcMine');
      current = getNearestEnemyInRange(current, enemies, mine.chainRange, hitIds);
    }

    mine.marker?.destroy?.();
    this.renderDetonation(mine, targets);
  }

  renderDetonation(mine, targets) {
    const graphics = this.scene?.add?.graphics?.();

    if (!graphics) {
      return;
    }

    graphics.clear();
    graphics.fillStyle(0x8fb7ff, 0.18);
    graphics.fillCircle(mine.x, mine.y, 26);
    graphics.fillStyle(0xebf7ff, 0.58);
    graphics.fillCircle(mine.x, mine.y, 10);

    let startPoint = mine;
    targets.forEach((target) => {
      const bolt = buildLightningBoltSegments(startPoint, target);
      const paths = [
        { points: bolt.mainPoints, width: 10, color: 0x5b61ff, alpha: 0.14 },
        { points: bolt.mainPoints, width: 5, color: 0x7fc3ff, alpha: 0.72 },
        { points: bolt.mainPoints, width: 2, color: 0xf6fcff, alpha: 0.98 }
      ];

      bolt.branches.forEach((branch) => {
        paths.push(
          { points: branch, width: 2.5, color: 0x7e8dff, alpha: 0.16 },
          { points: branch, width: 1.2, color: 0xdff4ff, alpha: 0.72 }
        );
      });

      paths.forEach((path) => {
        graphics.lineStyle(path.width, path.color, path.alpha);
        graphics.beginPath();
        graphics.moveTo(path.points[0].x, path.points[0].y);
        path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
        graphics.strokePath();
      });

      startPoint = target;
    });

    this.scene?.time?.delayedCall?.(110, () => graphics.destroy?.());
  }
}
