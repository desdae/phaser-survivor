import Phaser from 'phaser';
import { awardXp } from '../logic/progression.js';
import { getPlayerHealthBarState } from '../logic/playerHealthBar.js';

const PLAYER_STARTING_STATS = {
  speed: 220,
  maxHealth: 100,
  health: 100,
  level: 1,
  xp: 0,
  xpToNext: 10,
  projectileDamage: 18,
  projectileSpeed: 440,
  fireCooldownMs: 520,
  projectileCount: 1,
  projectilePierce: 0,
  projectileRicochet: 0,
  projectileSpreadDeg: 14,
  pickupRadius: 48,
  healthRegenPerSec: 0,
  damageTakenMultiplier: 1,
  globalDamageBonus: 0,
  moveSpeedBonus: 0,
  bladeUnlocked: false,
  bladeCount: 0,
  bladeDamage: 0,
  bladeOrbitRadius: 0,
  bladeOrbitSpeed: 0,
  chainUnlocked: false,
  chainDamage: 0,
  chainLinks: 0,
  chainRange: 0,
  chainCooldownMs: 0,
  novaUnlocked: false,
  novaDamage: 0,
  novaRadius: 0,
  novaCooldownMs: 0,
  novaEchoCount: 0,
  boomerangUnlocked: false,
  boomerangCount: 0,
  boomerangDamage: 0,
  boomerangRange: 0,
  boomerangCooldownMs: 0,
  meteorUnlocked: false,
  meteorCount: 0,
  meteorDamage: 0,
  meteorRadius: 0,
  meteorCooldownMs: 0,
  burstRifleUnlocked: false,
  burstRifleDamage: 0,
  burstRifleCooldownMs: 0,
  burstRifleProjectileSpeed: 0,
  burstRifleBurstCount: 0,
  burstRifleSpreadDeg: 0,
  lanceUnlocked: false,
  lanceDamage: 0,
  lanceCooldownMs: 0,
  lanceLength: 0,
  lanceWidth: 0,
  flamethrowerUnlocked: false,
  flamethrowerDamage: 0,
  flamethrowerRange: 0,
  flamethrowerCooldownMs: 0,
  flamethrowerArcDeg: 0,
  runeTrapUnlocked: false,
  runeTrapDamage: 0,
  runeTrapArmMs: 0,
  runeTrapRadius: 0,
  runeTrapCharges: 0,
  runeTrapCooldownMs: 0,
  arcMineUnlocked: false,
  arcMineDamage: 0,
  arcMineChains: 0,
  arcMineTriggerRadius: 0,
  arcMineChainRange: 0,
  arcMineCooldownMs: 0,
  spearBarrageUnlocked: false,
  spearBarrageDamage: 0,
  spearBarrageCount: 0,
  spearBarrageRadius: 0,
  spearBarrageCooldownMs: 0
};

export function applyMetaBonusesToStats(stats, metaBonuses = {}) {
  stats.maxHealth += metaBonuses.maxHealthBonus ?? 0;
  stats.health = Math.min(stats.maxHealth, stats.health + (metaBonuses.maxHealthBonus ?? 0));
  stats.pickupRadius += metaBonuses.pickupRadiusBonus ?? 0;
  stats.moveSpeedBonus += metaBonuses.moveSpeedBonus ?? 0;
  stats.metaRerolls = metaBonuses.rerollCharges ?? 0;
  stats.metaReviveUnlocked = Boolean(metaBonuses.reviveUnlocked);
  return stats;
}

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.image(x, y, 'player');
    this.sprite.setCircle(14);
    this.sprite.setDepth(5);
    this.healthBarFrame = scene.add.rectangle(0, 0, 0, 0, 0x08121c, 0.92).setOrigin(0);
    this.healthBarFrame.setStrokeStyle(1, 0x1a2933, 0.95);
    this.healthBarFrame.setDepth(5.1);
    this.healthBarFill = scene.add.rectangle(0, 0, 0, 0, 0xe45858, 0.98).setOrigin(0);
    this.healthBarFill.setDepth(5.2);
    this.stats = { ...PLAYER_STARTING_STATS };
    this.refreshHealthBar();
  }

  updateMovement(keys) {
    const horizontal = Number(keys.right.isDown) - Number(keys.left.isDown);
    const vertical = Number(keys.down.isDown) - Number(keys.up.isDown);

    if (horizontal === 0 && vertical === 0) {
      this.sprite.setVelocity(0, 0);
      this.refreshHealthBar();
      return;
    }

    const vector = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    const moveSpeed = this.stats.speed * (1 + (this.stats.moveSpeedBonus ?? 0));
    this.sprite.setVelocity(vector.x * moveSpeed, vector.y * moveSpeed);
    this.refreshHealthBar();
  }

  gainXp(amount) {
    const result = awardXp(
      {
        level: this.stats.level,
        xp: this.stats.xp
      },
      amount
    );

    this.stats.level = result.level;
    this.stats.xp = result.xp;
    this.stats.xpToNext = result.xpToNext;

    return result;
  }

  takeDamage(amount) {
    const scaledAmount = amount * (this.stats.damageTakenMultiplier ?? 1);
    this.stats.health = Math.max(0, this.stats.health - scaledAmount);
    this.refreshHealthBar();
    return this.stats.health === 0;
  }

  heal(amount) {
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    this.refreshHealthBar();
    return this.stats.health;
  }

  stop() {
    this.sprite.setVelocity(0, 0);
    this.refreshHealthBar();
  }

  refreshHealthBar() {
    const state = getPlayerHealthBarState(this.sprite.x, this.sprite.y, this.stats.health, this.stats.maxHealth);

    this.healthBarFrame.setPosition(state.frameX, state.frameY);
    this.healthBarFrame.setSize(state.frameWidth, state.frameHeight);
    this.healthBarFill.setPosition(state.fillX, state.fillY);
    this.healthBarFill.setSize(state.fillWidth, state.fillHeight);
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }
}
