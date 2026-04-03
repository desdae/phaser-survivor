import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { BladeManager } from '../systems/BladeManager.js';
import { PickupManager } from '../systems/PickupManager.js';
import { ProjectileManager } from '../systems/ProjectileManager.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { createGameOverOverlay, createHud, createLevelUpOverlay } from '../ui/overlayFactory.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.gameScene = this;
    this.createTextures();
    this.physics.world.setBounds(-1000000, -1000000, 2000000, 2000000);

    this.elapsedMs = 0;
    this.isGameplayPaused = false;
    this.isGameOver = false;

    this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'grid');
    this.background.setOrigin(0);
    this.background.setScrollFactor(0);
    this.background.setDepth(0);

    this.player = new Player(this, 0, 0);
    this.pickupManager = new PickupManager(this, (value) => this.handlePickupCollected(value));
    this.enemyManager = new EnemyManager(this, this.player, this.pickupManager);
    this.projectileManager = new ProjectileManager(this);
    this.bladeManager = new BladeManager(this);
    this.upgradeSystem = new UpgradeSystem();

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.upgradeKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    ];

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.roundPixels = true;

    this.hud = createHud(this);
    this.levelUpOverlay = createLevelUpOverlay(this, (choice) => this.handleUpgradeSelected(choice));
    this.gameOverOverlay = createGameOverOverlay(this, () => this.scene.restart());

    this.physics.add.overlap(this.projectileManager.group, this.enemyManager.group, (projectile, enemy) => {
      this.projectileManager.handleEnemyHit(projectile, enemy, this.enemyManager);
    });
    this.physics.add.overlap(this.player.sprite, this.enemyManager.group, (_, enemy) => {
      this.handlePlayerEnemyOverlap(enemy);
    });

    this.scale.on('resize', this.handleResize, this);
    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.refreshHud();
  }

  update(time, delta) {
    this.background.tilePositionX = this.cameras.main.scrollX;
    this.background.tilePositionY = this.cameras.main.scrollY;

    if (this.isGameOver && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (this.isGameplayPaused) {
      this.handleUpgradeHotkeys();
      this.refreshHud();
      return;
    }

    this.elapsedMs += delta;
    this.player.updateMovement(this.keys);
    this.enemyManager.update(delta, this.elapsedMs / 1000);
    this.projectileManager.update(time);
    this.projectileManager.tryFire(this.player, this.enemyManager.getLivingEnemies(), time);
    this.bladeManager.syncToPlayer(this.player.stats);
    this.bladeManager.update(
      this.player,
      this.player.stats,
      delta,
      time,
      this.enemyManager.getLivingEnemies(),
      this.enemyManager
    );
    this.pickupManager.update(this.player.sprite, this.player.stats.pickupRadius);
    this.refreshHud();
  }

  handlePickupCollected(value) {
    if (this.isGameOver) {
      return;
    }

    const result = this.player.gainXp(value);

    if (result.leveledUp) {
      this.openLevelUp();
    }
  }

  handlePlayerEnemyOverlap(enemy) {
    if (this.isGameplayPaused || this.isGameOver || !enemy?.active) {
      return;
    }

    const now = this.time.now;

    if (!this.enemyManager.canDamagePlayer(enemy, now)) {
      return;
    }

    const died = this.player.takeDamage(enemy.contactDamage);
    this.cameras.main.shake(90, 0.0026);
    this.refreshHud();

    if (died) {
      this.openGameOver();
    }
  }

  openLevelUp() {
    this.isGameplayPaused = true;
    this.physics.world.pause();
    this.player.stop();
    this.enemyManager.stopAll();
    this.projectileManager.stopAll();
    this.levelUpOverlay.show(this.upgradeSystem.getChoices(this.player.stats));
  }

  handleUpgradeHotkeys() {
    if (this.isGameOver) {
      return;
    }

    this.upgradeKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.levelUpOverlay.chooseIndex(index);
      }
    });
  }

  handleUpgradeSelected(choice) {
    this.upgradeSystem.apply(this.player, choice.key);
    this.levelUpOverlay.hide();

    if (!this.isGameOver) {
      this.physics.world.resume();
      this.isGameplayPaused = false;
    }

    this.refreshHud();
  }

  openGameOver() {
    this.isGameOver = true;
    this.isGameplayPaused = true;
    this.physics.world.pause();
    this.player.stop();
    this.enemyManager.stopAll();
    this.projectileManager.stopAll();
    this.levelUpOverlay.hide();
    this.gameOverOverlay.show({
      timeMs: this.elapsedMs,
      level: this.player.stats.level
    });
  }

  refreshHud() {
    this.hud.update({
      health: this.player.stats.health,
      maxHealth: this.player.stats.maxHealth,
      level: this.player.stats.level,
      xp: this.player.stats.xp,
      xpToNext: this.player.stats.xpToNext,
      timeMs: this.elapsedMs,
      enemyCount: this.enemyManager.getLivingEnemies().length
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    if (this.background) {
      this.background.setSize(width, height);
    }

    if (this.hud) {
      this.hud.layout(width, height);
    }

    if (this.levelUpOverlay) {
      this.levelUpOverlay.layout(width, height);
    }

    if (this.gameOverOverlay) {
      this.gameOverOverlay.layout(width, height);
    }
  }

  createTextures() {
    if (this.textures.exists('player')) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.clear();
    graphics.fillStyle(0x1d4f7a, 1);
    graphics.fillCircle(14, 14, 14);
    graphics.lineStyle(3, 0xc6ecff, 1);
    graphics.strokeCircle(14, 14, 12);
    graphics.generateTexture('player', 28, 28);

    graphics.clear();
    graphics.fillStyle(0xcc5d47, 1);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('enemy-basic', 24, 24);

    graphics.clear();
    graphics.fillStyle(0x883644, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.lineStyle(2, 0xffc2ae, 1);
    graphics.strokeCircle(16, 16, 15);
    graphics.generateTexture('enemy-tough', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xffefaa, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('projectile', 10, 10);

    graphics.clear();
    graphics.fillStyle(0xd9f2ff, 1);
    graphics.fillTriangle(6, 20, 14, 0, 22, 20);
    graphics.generateTexture('blade', 28, 22);

    graphics.clear();
    graphics.fillStyle(0x7df0ac, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.lineStyle(2, 0xdfffe9, 1);
    graphics.strokeCircle(8, 8, 7);
    graphics.generateTexture('xp-orb', 16, 16);

    graphics.clear();
    graphics.fillStyle(0x0b1721, 1);
    graphics.fillRect(0, 0, 128, 128);
    graphics.lineStyle(1, 0x15354b, 0.95);
    for (let offset = 0; offset <= 128; offset += 32) {
      graphics.lineBetween(offset, 0, offset, 128);
      graphics.lineBetween(0, offset, 128, offset);
    }
    graphics.generateTexture('grid', 128, 128);

    graphics.destroy();
  }
}
