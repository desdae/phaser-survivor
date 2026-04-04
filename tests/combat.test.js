import { describe, expect, it } from 'vitest';
import {
  createEnemyQuery,
  getNearbyEnemies,
  getQueryEnemiesByTier,
  getNearestEnemy,
  getProjectileVelocity,
  getRicochetTarget,
  getShotDirections,
  registerProjectileHit
} from '../src/game/logic/combat.js';
import { ProjectileManager } from '../src/game/systems/ProjectileManager.js';

describe('getNearestEnemy', () => {
  it('returns the closest living enemy', () => {
    const player = { x: 0, y: 0 };
    const enemies = [
      { active: true, x: 100, y: 0, id: 'far' },
      { active: true, x: 25, y: 0, id: 'near' },
      { active: false, x: 5, y: 0, id: 'inactive' }
    ];

    expect(getNearestEnemy(player, enemies)?.id).toBe('near');
  });

  it('returns null when no active enemies exist', () => {
    expect(getNearestEnemy({ x: 0, y: 0 }, [{ active: false, x: 5, y: 5 }])).toBeNull();
  });
});

describe('createEnemyQuery', () => {
  it('returns only nearby active enemies from relevant local cells', () => {
    const query = createEnemyQuery([
      { active: true, id: 'near-a', x: 12, y: 8 },
      { active: true, id: 'near-b', x: 86, y: 22 },
      { active: false, id: 'inactive', x: 20, y: 12 },
      { active: true, id: 'far', x: 280, y: 10 }
    ], 96);

    expect(getNearbyEnemies({ x: 0, y: 0 }, query, 120).map((enemy) => enemy.id)).toEqual([
      'near-a',
      'near-b'
    ]);
  });
});

describe('getQueryEnemiesByTier', () => {
  it('returns only enemies in the requested tier bucket', () => {
    const query = createEnemyQuery(
      [
        { active: true, id: 'near', x: 50, y: 0, lodTier: 'near' },
        { active: true, id: 'mid', x: 500, y: 0, lodTier: 'mid' },
        { active: true, id: 'far', x: 1200, y: 0, lodTier: 'far' }
      ],
      96
    );

    expect(getQueryEnemiesByTier(query, 'near').map((enemy) => enemy.id)).toEqual(['near']);
    expect(getQueryEnemiesByTier(query, 'mid').map((enemy) => enemy.id)).toEqual(['mid']);
  });
});

describe('getNearbyEnemies', () => {
  it('prefers tier-filtered local buckets when a query is provided', () => {
    const query = createEnemyQuery(
      [
        { active: true, id: 'near-a', x: 10, y: 10, lodTier: 'near' },
        { active: true, id: 'near-b', x: 40, y: 0, lodTier: 'near' },
        { active: true, id: 'mid-a', x: 60, y: 0, lodTier: 'mid' }
      ],
      96
    );

    expect(
      getNearbyEnemies({ x: 0, y: 0 }, query, 80, Number.POSITIVE_INFINITY, null, ['near']).map(
        (enemy) => enemy.id
      )
    ).toEqual(['near-a', 'near-b']);
  });

  it('filters a plain enemy array by allowed tiers', () => {
    const enemies = [
      { active: true, id: 'near-a', x: 10, y: 10, lodTier: 'near' },
      { active: true, id: 'mid-a', x: 30, y: 0, lodTier: 'mid' },
      { active: true, id: 'far-a', x: 50, y: 0, lodTier: 'far' }
    ];

    expect(
      getNearbyEnemies({ x: 0, y: 0 }, enemies, 80, Number.POSITIVE_INFINITY, null, ['mid']).map(
        (enemy) => enemy.id
      )
    ).toEqual(['mid-a']);
  });
});

describe('getProjectileVelocity', () => {
  it('returns normalized velocity scaled by projectile speed', () => {
    expect(getProjectileVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 500)).toEqual({
      x: 300,
      y: 400
    });
  });
});

describe('getShotDirections', () => {
  it('returns one angle for a single-shot weapon', () => {
    expect(getShotDirections({ x: 1, y: 0 }, 1, 14)).toEqual([{ x: 1, y: 0 }]);
  });

  it('returns a symmetric spread for multishot', () => {
    const directions = getShotDirections({ x: 1, y: 0 }, 3, 20);

    expect(directions).toHaveLength(3);
    expect(directions[0]).not.toEqual(directions[1]);
    expect(directions[1]).not.toEqual(directions[2]);
    expect(directions[0].x).toBeCloseTo(directions[2].x, 3);
    expect(directions[0].y).toBeCloseTo(-directions[2].y, 3);
    expect(directions[1]).toEqual({ x: 1, y: 0 });
  });
});

describe('getRicochetTarget', () => {
  it('finds the nearest new nearby enemy that is not the one just hit', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const closerEnemy = { x: 110, y: 102, active: true, id: 'closer' };
    const nextEnemy = { x: 130, y: 110, active: true, id: 'second' };
    const distantEnemy = { x: 500, y: 500, active: true, id: 'distant' };
    const query = createEnemyQuery([currentEnemy, nextEnemy, closerEnemy, distantEnemy], 96);

    expect(getRicochetTarget(currentEnemy, query, 80)?.id).toBe('closer');
  });

  it('rejects targets beyond the ricochet range', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const distantEnemy = { x: 250, y: 250, active: true, id: 'second' };

    expect(getRicochetTarget(currentEnemy, [currentEnemy, distantEnemy], 80)).toBeNull();
  });
});

describe('registerProjectileHit', () => {
  it('returns false when the same enemy is seen twice by the same projectile', () => {
    const projectile = {};
    const enemy = { id: 'enemy-1' };

    expect(registerProjectileHit(projectile, enemy)).toBe(true);
    expect(registerProjectileHit(projectile, enemy)).toBe(false);
  });

  it('tracks separate enemies independently', () => {
    const projectile = {};

    expect(registerProjectileHit(projectile, { id: 'enemy-1' })).toBe(true);
    expect(registerProjectileHit(projectile, { id: 'enemy-2' })).toBe(true);
  });
});

describe('ProjectileManager', () => {
  function createManager() {
    const projectiles = [];

    const group = {
      children: {
        iterate: (callback) => {
          projectiles.forEach(callback);
        }
      },
      getChildren: () => projectiles,
      create: (x, y, key) => {
        const projectile = {
          active: true,
          body: { velocity: { x: 0, y: 0 } },
          expiresAt: 0,
          key,
          setActive(value) {
            this.active = value;
            return this;
          },
          setCircle: () => {},
          setDepth: () => {},
          setPosition(xPos, yPos) {
            this.x = xPos;
            this.y = yPos;
            return this;
          },
          setVelocity(xVel, yVel) {
            this.body.velocity = { x: xVel, y: yVel };
            return this;
          },
          setVisible(value) {
            this.visible = value;
            return this;
          },
          visible: true,
          x,
          y
        };

        projectiles.push(projectile);
        return projectile;
      }
    };

    const scene = {
      physics: {
        add: {
          group: () => group
        }
      }
    };

    return { group, manager: new ProjectileManager(scene), projectiles };
  }

  it('emits one projectile per shot direction and preserves branch counters', () => {
    const { manager, projectiles } = createManager();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        fireCooldownMs: 150,
        projectileCount: 3,
        projectileDamage: 9,
        projectilePierce: 2,
        projectileRicochet: 1,
        projectileSpeed: 120,
        projectileSpreadDeg: 20
      }
    };
    const enemies = [{ active: true, id: 'target', x: 100, y: 0 }];

    const shots = manager.tryFire(player, enemies, 0);

    expect(shots).toHaveLength(3);
    expect(projectiles).toHaveLength(3);
    expect(shots.every((shot) => shot.damage === 9)).toBe(true);
    expect(shots.every((shot) => shot.remainingPierce === 2)).toBe(true);
    expect(shots.every((shot) => shot.remainingRicochet === 1)).toBe(true);
  });

  it('skips duplicate hits and ricochets to a fresh target', () => {
    const { manager } = createManager();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        fireCooldownMs: 150,
        projectileCount: 1,
        projectileDamage: 9,
        projectilePierce: 0,
        projectileRicochet: 2,
        projectileSpeed: 120,
        projectileSpreadDeg: 0
      }
    };
    const enemy1 = { active: true, id: 'enemy-1', x: 100, y: 0 };
    const enemy2 = { active: true, id: 'enemy-2', x: 130, y: 0 };
    const enemy3 = { active: true, id: 'enemy-3', x: 170, y: 30 };
    const enemyManager = {
      damageEnemyCalls: [],
      damageEnemy(enemy, damage) {
        this.damageEnemyCalls.push({ damage, enemy });
      },
      getLivingEnemies: () => [enemy1, enemy2, enemy3]
    };
    const projectile = manager.tryFire(player, [enemy1, enemy2, enemy3], 0)[0];

    manager.handleEnemyHit(projectile, enemy1, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(1);
    expect(enemyManager.damageEnemyCalls[0].enemy).toBe(enemy1);

    manager.handleEnemyHit(projectile, enemy1, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(1);

    manager.handleEnemyHit(projectile, enemy2, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(2);
    expect(enemyManager.damageEnemyCalls[1].enemy).toBe(enemy2);
    expect(projectile.body.velocity.x).toBeCloseTo(170 / Math.hypot(170, 30) * 120, 3);
    expect(projectile.body.velocity.y).toBeCloseTo(30 / Math.hypot(170, 30) * 120, 3);
  });

  it('reuses an inactive projectile instead of creating a new one', () => {
    const { group, manager, projectiles } = createManager();
    const recycled = group.create(4, 6, 'projectile');
    recycled.setActive(false);
    recycled.setVisible(false);
    group.create = () => {
      throw new Error('should not create a fresh projectile');
    };

    const projectile = manager.fireProjectile(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      {
        projectileDamage: 8,
        projectilePierce: 0,
        projectileRicochet: 0,
        projectileSpeed: 120
      },
      1000
    );

    expect(projectile).toBe(recycled);
    expect(projectiles).toHaveLength(1);
    expect(recycled.active).toBe(true);
    expect(recycled.visible).toBe(true);
    expect(recycled.x).toBe(0);
    expect(recycled.y).toBe(0);
  });
});
