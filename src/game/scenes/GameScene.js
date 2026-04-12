import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { countLearnedAbilities, getOwnedAbilityKeys } from '../logic/abilityRoster.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { ArcMineManager } from '../systems/ArcMineManager.js';
import { BladeManager } from '../systems/BladeManager.js';
import { BoomerangManager } from '../systems/BoomerangManager.js';
import { BloodEffectsManager } from '../systems/BloodEffectsManager.js';
import { BurstRifleManager } from '../systems/BurstRifleManager.js';
import { ChainManager } from '../systems/ChainManager.js';
import { DamageStatsManager } from '../systems/DamageStatsManager.js';
import { FlamethrowerManager } from '../systems/FlamethrowerManager.js';
import { LanceManager } from '../systems/LanceManager.js';
import { MeteorManager } from '../systems/MeteorManager.js';
import { NovaManager } from '../systems/NovaManager.js';
import { RuneTrapManager } from '../systems/RuneTrapManager.js';
import { SpearBarrageManager } from '../systems/SpearBarrageManager.js';
import { EliteWaveSystem } from '../systems/EliteWaveSystem.js';
import { BossSystem } from '../systems/BossSystem.js';
import { ChestRewardSystem } from '../systems/ChestRewardSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { PickupManager } from '../systems/PickupManager.js';
import { ProjectileManager } from '../systems/ProjectileManager.js';
import { TemporaryBuffSystem } from '../systems/TemporaryBuffSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import {
  GRASS_TILE_SIZE,
  getGrassTextureKey,
  getVisibleGrassTiles
} from '../logic/backgroundTiles.js';
import {
  getVisibleStructureTiles
} from '../logic/worldStructures.js';
import {
  getPowerupCompassState
} from '../logic/powerupCompass.js';
import { getAimDirection } from '../logic/combat.js';
import {
  buildJournalPayload
} from '../logic/journalData.js';
import {
  createJournalDiscoveryState,
  discoverAbility,
  discoverEnemy
} from '../logic/journalDiscovery.js';
import { getMagicMissileTextureSpec } from '../logic/projectileVisuals.js';
import { getSpawnProfile } from '../logic/spawn.js';
import { getCobbleWallTextureSpec } from '../logic/wallVisuals.js';
import { buildWeaponTooltipMap } from '../logic/weaponTooltips.js';
import {
  createChestOverlay,
  createBossOverlay,
  createDamageStatsOverlay,
  createFpsCounter,
  createGameOverOverlay,
  createHud,
  createJournalOverlay,
  createLevelUpOverlay,
  createPowerupHud
} from '../ui/overlayFactory.js';

const NECROMANCER_BOSS_TEXTURE_KEYS = new Set([
  'boss-necromancer-idle',
  'boss-necromancer-idle-1',
  'boss-necromancer-idle-2',
  'boss-necromancer-cast',
  'boss-necromancer-summon',
  'boss-necromancer-pulse',
  'boss-necromancer-death',
  'boss-necromancer-portrait'
]);

const NECROMANCER_BOSS_ART_IMPORTS = import.meta.glob(
  '../../assets/bosses/necromancer/*.{png,jpg,jpeg,webp,avif}',
  {
    eager: true,
    import: 'default'
  }
);

function getNecromancerBossArtEntries() {
  return Object.entries(NECROMANCER_BOSS_ART_IMPORTS).flatMap(([path, url]) => {
    const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '');

    if (!fileName || !NECROMANCER_BOSS_TEXTURE_KEYS.has(fileName)) {
      return [];
    }

    return [{ key: fileName, url }];
  });
}

function buildBossOverlayState({ activeBoss = null, elapsedMs = 0, bossSystem = null } = {}) {
  if (activeBoss) {
    const maxHealth = Math.max(1, activeBoss.maxHealth ?? activeBoss.health ?? 1);
    return {
      healthRatio: Math.max(0, Math.min(1, (activeBoss.health ?? 0) / maxHealth)),
      label: activeBoss.bossName ?? 'Boss',
      visible: true,
      warning: ''
    };
  }

  if (bossSystem?.isWarningActive?.(elapsedMs) && bossSystem?.state?.pendingBoss) {
    return {
      healthRatio: 0,
      label: '',
      visible: true,
      warning: 'Necromancer approaching'
    };
  }

  return {
    healthRatio: 0,
    label: '',
    visible: false,
    warning: ''
  };
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
    this.backgroundTiles = [];
    this.structureTiles = [];
    this.powerupCompassIndicators = [];
  }

  preload() {
    getNecromancerBossArtEntries().forEach(({ key, url }) => {
      this.load.image(key, url);
    });
  }

  create() {
    this.gameScene = this;
    this.createTextures();
    this.physics.world.setBounds(-1000000, -1000000, 2000000, 2000000);

    this.elapsedMs = 0;
    this.mouseWorld = { x: 0, y: 0 };
    this.nextFpsUpdateAt = 0;
    this.isGameplayPaused = false;
    this.isGameOver = false;
    this.activePauseOverlay = null;
    this.journalDiscovery = createJournalDiscoveryState();
    this.journalViewState = {
      activeTab: 'enemies',
      selectedByTab: {
        enemies: null,
        abilities: null
      }
    };
    this.journalPayload = null;

    this.player = new Player(this, 0, 0);
    this.pickupManager = new PickupManager(this, (pickup) => this.handlePickupCollected(pickup));
    this.damageStatsManager = new DamageStatsManager();
    this.bloodEffectsManager = new BloodEffectsManager(this);
    this.audioManager = new AudioManager();
    this.enemyManager = new EnemyManager(
      this,
      this.player,
      this.pickupManager,
      this.bloodEffectsManager,
      Math.random,
      this.damageStatsManager,
      this.audioManager,
      (typeKey) => this.recordEnemyDiscovery(typeKey)
    );
    this.projectileManager = new ProjectileManager(this);
    this.burstRifleManager = new BurstRifleManager(this.projectileManager);
    this.bladeManager = new BladeManager(this);
    this.chainManager = new ChainManager(this);
    this.novaManager = new NovaManager(this);
    this.boomerangManager = new BoomerangManager(this);
    this.meteorManager = new MeteorManager(this);
    this.flamethrowerManager = new FlamethrowerManager(this);
    this.runeTrapManager = new RuneTrapManager(this);
    this.lanceManager = new LanceManager(this);
    this.arcMineManager = new ArcMineManager(this);
    this.spearBarrageManager = new SpearBarrageManager(this);
    this.wallGroup = this.physics.add.staticGroup();
    this.upgradeSystem = new UpgradeSystem();
    this.temporaryBuffSystem = new TemporaryBuffSystem();
    this.chestRewardSystem = new ChestRewardSystem();
    this.eliteWaveSystem = new EliteWaveSystem();
    this.bossSystem = new BossSystem();
    this.eliteWarningPlayed = false;
    this.bossWarningPlayed = false;

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.journalKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.statsKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.input.keyboard.addCapture?.(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.upgradeKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    ];

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.roundPixels = true;
    this.syncBackgroundTiles?.();
    this.syncStructureTiles?.();

    this.hud = createHud(this);
    this.fpsCounter = createFpsCounter(this);
    this.powerupHud = createPowerupHud(this);
    this.bossOverlay = createBossOverlay(this);
    this.syncPowerupCompassIndicators?.();
    this.damageStatsOverlay = createDamageStatsOverlay(this);
    this.journalOverlay = createJournalOverlay(this);
    this.levelUpOverlay = createLevelUpOverlay(this, (choice) => this.handleUpgradeSelected(choice));
    this.chestOverlay = createChestOverlay(this, (reward) => this.handleChestRewardSelected(reward));
    this.gameOverOverlay = createGameOverOverlay(this, () => this.restartRun());
    this.input.once('pointerdown', () => {
      this.audioManager?.unlock?.();
    });
    this.input.keyboard.once('keydown', () => {
      this.audioManager?.unlock?.();
    });
    this.input.on('pointerdown', (pointer) => this.handleScenePointerDown(pointer));
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) =>
      this.handleSceneWheel(pointer, deltaY)
    );
    this.input.keyboard.on?.('keydown-R', () => this.handleRestartKeyDown());

    this.physics.add.overlap(this.projectileManager.group, this.enemyManager.group, (projectile, enemy) => {
      this.projectileManager.handleEnemyHit(projectile, enemy, this.enemyManager);
    });
    this.physics.add.collider(this.player.sprite, this.wallGroup);
    this.physics.add.collider(this.enemyManager.group, this.wallGroup);
    this.physics.add.collider(this.projectileManager.group, this.wallGroup, (projectile) => {
      this.projectileManager.deactivateProjectile(projectile);
    });
    this.physics.add.collider(this.enemyManager.enemyProjectileGroup, this.wallGroup, (projectile) => {
      this.enemyManager.deactivateEnemyProjectile?.(projectile) ?? projectile.destroy?.();
    });
    this.physics.add.overlap(this.player.sprite, this.enemyManager.group, (_, enemy) => {
      this.handlePlayerEnemyOverlap(enemy);
    });
    this.physics.add.overlap(this.player.sprite, this.enemyManager.enemyProjectileGroup, (_, projectile) => {
      if (this.isGameplayPaused || this.isGameOver || !projectile?.active) {
        return;
      }

      this.enemyManager.deactivateEnemyProjectile?.(projectile) ?? projectile.destroy?.();
      const died = this.player.takeDamage(projectile.damage);
      this.audioManager?.playPlayerHurt?.();

      if (died) {
        this.openGameOver();
      }
    });

    this.scale.on('resize', this.handleResize, this);
    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.damageStatsManager.syncUnlockedWeapons(this.player.stats, this.elapsedMs);
    this.syncAbilityDiscoveries();
    this.refreshHud();
  }

  update(time, delta) {
    this.syncBackgroundTiles?.();
    this.syncStructureTiles?.();
    this.handleStatsToggle();
    this.updateFpsCounter?.(time);
    this.handleJournalKey?.();

    const pointer = this.input?.activePointer;
    if (pointer) {
      this.mouseWorld = {
        x: pointer.worldX,
        y: pointer.worldY
      };
    }

    if (this.isGameOver && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      GameScene.prototype.handleRestartKeyDown.call(this);
      return;
    }

    if (this.isGameplayPaused) {
      this.handlePauseHotkeys();
      this.refreshHud();
      GameScene.prototype.refreshDamageStatsHover.call(this, pointer);
      return;
    }

    this.elapsedMs += delta;
    this.player.updateMovement(this.keys);
    this.updateEliteWave();
    GameScene.prototype.updateBossEncounter.call(this);
    this.temporaryBuffSystem?.update?.(this.elapsedMs);
    const effectiveStats =
      this.temporaryBuffSystem?.getEffectiveStats?.(this.player.stats, this.elapsedMs) ?? this.player.stats;
    this.applyPassiveRegen?.(delta, effectiveStats);
    const livingEnemies = this.enemyManager.update(delta, this.elapsedMs / 1000, time) ?? [];

    if (this.enemyManager.playerPoisonDamaged) {
      this.audioManager?.playPlayerHurt?.();
      this.cameras.main.shake(70, 0.0018);
      if (this.enemyManager.playerKilledByPoison) {
        this.refreshHud(livingEnemies.length);
        this.openGameOver();
        return;
      }
    }

    const nearEnemyQuery =
      this.enemyManager.getNearEnemyQuery?.() ?? this.enemyManager.getEnemyQuery?.() ?? livingEnemies;
    const aimDirection = getAimDirection(this.player.sprite, this.mouseWorld);
    this.projectileManager.update(time);
    this.projectileManager.tryFire(this.player, effectiveStats, livingEnemies, time);
    this.burstRifleManager?.update?.(this.player, effectiveStats, aimDirection, time);
    this.bladeManager.syncToPlayer(effectiveStats);
    this.bladeManager.update(
      this.player,
      effectiveStats,
      delta,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.chainManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
    this.novaManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
    this.flamethrowerManager?.update?.(
      this.player,
      effectiveStats,
      aimDirection,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.runeTrapManager?.update?.(
      this.player,
      effectiveStats,
      this.mouseWorld,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.lanceManager?.update?.(
      this.player,
      effectiveStats,
      aimDirection,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.boomerangManager.update(
      this.player,
      effectiveStats,
      delta,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.arcMineManager?.update?.(
      this.player,
      effectiveStats,
      this.mouseWorld,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.meteorManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
    this.spearBarrageManager?.update?.(
      this.player,
      effectiveStats,
      this.mouseWorld,
      time,
      nearEnemyQuery,
      this.enemyManager
    );
    this.pickupManager.update(this.player.sprite, effectiveStats.pickupRadius);
    GameScene.prototype.handleBossDefeated.call(this, this.enemyManager.consumeBossDeath?.());
    this.updatePowerupCompassIndicators?.();
    this.refreshHud(livingEnemies.length);
    GameScene.prototype.refreshDamageStatsHover.call(this, pointer);
  }

  applyPassiveRegen(delta, effectiveStats = this.player?.stats) {
    const regenPerSec = effectiveStats?.healthRegenPerSec ?? 0;

    if (!regenPerSec || !this.player?.stats || this.player.stats.health >= this.player.stats.maxHealth) {
      return;
    }

    this.player.heal((regenPerSec * delta) / 1000);
  }

  refreshDamageStatsHover(pointer = this.input?.activePointer) {
    if (!pointer || !this.damageStatsOverlay?.isVisible?.()) {
      return;
    }

    this.damageStatsOverlay.hoverPointer(pointer.x, pointer.y);
  }

  handleRestartKeyDown() {
    if (!this.isGameOver) {
      return;
    }

    this.restartRun();
  }

  handleScenePointerDown(pointer) {
    if (this.isGameOver) {
      this.gameOverOverlay.choosePointer(pointer.x, pointer.y);
      return;
    }

    if (!this.isGameplayPaused) {
      return;
    }

    if (this.activePauseOverlay === 'journal') {
      this.handleJournalPointerResult(this.journalOverlay.handlePointer(pointer.x, pointer.y));
      return;
    }

    if (this.activePauseOverlay === 'chest') {
      this.chestOverlay.choosePointer(pointer.x, pointer.y);
      return;
    }

    this.levelUpOverlay.choosePointer(pointer.x, pointer.y);
  }

  handleSceneWheel(pointer, deltaY) {
    if (this.activePauseOverlay !== 'journal' || !this.isGameplayPaused) {
      return;
    }

    this.journalOverlay?.handleWheel?.(pointer.x, pointer.y, deltaY);
  }

  handleJournalKey() {
    if (
      this.activePauseOverlay === 'journal' &&
      this.escapeKey &&
      Phaser.Input.Keyboard.JustDown(this.escapeKey)
    ) {
      this.handleJournalToggle();
      return;
    }

    if (this.journalKey && Phaser.Input.Keyboard.JustDown(this.journalKey)) {
      this.handleJournalToggle();
    }
  }

  handleJournalToggle() {
    if (this.isGameOver) {
      return;
    }

    if (this.activePauseOverlay === 'journal') {
      this.journalOverlay?.hide?.();
      this.activePauseOverlay = null;
      this.physics?.world?.resume?.();
      this.isGameplayPaused = false;
      return;
    }

    if (this.activePauseOverlay) {
      return;
    }

    this.refreshJournalOverlay();
    this.isGameplayPaused = true;
    this.activePauseOverlay = 'journal';
    this.physics?.world?.pause?.();
    this.player?.stop?.();
    this.journalOverlay?.show?.(this.journalPayload);
  }

  handleJournalPointerResult(result) {
    if (!result) {
      return;
    }

    if (result.type === 'close') {
      this.handleJournalToggle();
      return;
    }

    if (result.type === 'switch-tab') {
      this.journalViewState.activeTab = result.tab;

      if (!this.journalViewState.selectedByTab[result.tab]) {
        const rows = result.tab === 'enemies' ? this.journalPayload?.enemies : this.journalPayload?.abilities;
        this.journalViewState.selectedByTab[result.tab] = rows?.[0]?.key ?? null;
      }

      this.refreshJournalOverlay();
      return;
    }

    if (result.type === 'select-entry') {
      this.journalViewState.selectedByTab[result.tab] = result.key;
      this.refreshJournalOverlay();
    }
  }

  recordEnemyDiscovery(typeKey) {
    discoverEnemy(this.journalDiscovery, typeKey);
  }

  recordAbilityDiscovery(abilityKey) {
    discoverAbility(this.journalDiscovery, abilityKey);
  }

  syncAbilityDiscoveries() {
    getOwnedAbilityKeys(this.player?.stats ?? {}).forEach((abilityKey) => {
      this.recordAbilityDiscovery(abilityKey);
    });
  }

  refreshJournalOverlay() {
    this.journalPayload = buildJournalPayload({
      activeTab: this.journalViewState.activeTab,
      selectedByTab: this.journalViewState.selectedByTab,
      discoveryState: this.journalDiscovery,
      playerStats: this.player?.stats ?? {}
    });

    this.journalOverlay?.update?.(this.journalPayload);
  }

  updateEliteWave() {
    const eliteState = this.eliteWaveSystem.update(this.elapsedMs);

    if (!eliteState?.pendingElite) {
      this.eliteWarningPlayed = false;
      return;
    }

    if (this.eliteWaveSystem.isWarningActive(this.elapsedMs)) {
      if (!this.eliteWarningPlayed) {
        this.audioManager?.playEliteWarning?.();
        this.eliteWarningPlayed = true;
      }

      return;
    }

    const profile = getSpawnProfile(this.elapsedMs / 1000);
    const typeKey = this.enemyManager.pickEnemyType(profile.weights);

    this.enemyManager.spawnEnemy(typeKey, { elite: true });
    this.eliteWaveSystem.consumeSpawn();
    this.eliteWarningPlayed = false;
  }

  getBossSpawnPosition() {
    const camera = this.cameras?.main;
    const playerSprite = this.player?.sprite;

    if (!camera || !playerSprite) {
      return { x: 0, y: 0 };
    }

    return {
      x: camera.scrollX + camera.width + 72,
      y: playerSprite.y - 36
    };
  }

  updateBossEncounter() {
    const bossState = this.bossSystem?.update?.(this.elapsedMs);

    if (!bossState?.pendingBoss) {
      this.bossWarningPlayed = false;
      return;
    }

    if (this.bossSystem.isWarningActive(this.elapsedMs)) {
      if (!this.bossWarningPlayed) {
        this.audioManager?.playEliteWarning?.();
        this.bossWarningPlayed = true;
      }

      return;
    }

    if (this.enemyManager?.getActiveBoss?.()) {
      return;
    }

    this.enemyManager?.spawnEnemy?.('necromancerBoss', {
      boss: true,
      position: this.getBossSpawnPosition()
    });
    this.bossSystem?.consumeSpawn?.();
    this.bossWarningPlayed = false;
  }

  handleBossDefeated(bossDeath) {
    if (!bossDeath) {
      return;
    }

    this.bossSystem?.markDefeated?.();
    this.pickupManager?.spawnChest?.(bossDeath.x, bossDeath.y, bossDeath.type);
    this.refreshHud();
  }

  handlePickupCollected(pickup) {
    if (this.isGameOver || this.isGameplayPaused || this.activePauseOverlay) {
      return false;
    }

    if (pickup.kind === 'chest') {
      this.audioManager?.playChestOpen?.();
      this.openChestReward(pickup);
      return true;
    }

    if (pickup.kind === 'powerup') {
      this.audioManager?.playPickup?.();
      if (pickup.buffKey === 'frost') {
        const playerSprite = this.player?.sprite ?? this.player;
        const x = playerSprite?.x ?? 0;
        const y = playerSprite?.y ?? 0;
        this.enemyManager?.applyAreaSlow?.(x, y, 200, this.elapsedMs, 20000, 0.5);
        this.playSlowBurstVfx?.(x, y);
        this.refreshHud();
        return false;
      }

      this.temporaryBuffSystem.addStack(pickup.buffKey, this.elapsedMs);
      this.refreshHud();
      return false;
    }

    if (pickup.kind === 'heart') {
      this.audioManager?.playPickup?.();
      this.player.heal(pickup.value);
      this.refreshHud();
      return false;
    }

    const result = this.player.gainXp(pickup.value);

    if (result.leveledUp) {
      this.audioManager?.playLevelUp?.();
      this.openLevelUp();
    }

    return result.leveledUp;
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
    this.audioManager?.playPlayerHurt?.();
    this.cameras.main.shake(90, 0.0026);
    this.refreshHud();

    if (died) {
      this.openGameOver();
    }
  }

  openLevelUp() {
    this.isGameplayPaused = true;
    this.activePauseOverlay = 'levelUp';
    this.physics.world.pause();
    this.player.stop();
    this.levelUpOverlay.show(this.upgradeSystem.getChoices(this.player.stats));
  }

  openChestReward(pickup = null) {
    if (this.isGameOver || this.isGameplayPaused || this.activePauseOverlay) {
      return false;
    }

    this.isGameplayPaused = true;
    this.activePauseOverlay = 'chest';
    this.pendingChestPickup = pickup;
    this.physics.world.pause();
    this.player.stop();
    this.chestOverlay.show(this.chestRewardSystem.getChoices(this.player.stats));
  }

  handlePauseHotkeys() {
    if (this.isGameOver) {
      return;
    }

    if (this.activePauseOverlay === 'journal') {
      return;
    }

    this.upgradeKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        if (this.activePauseOverlay === 'chest') {
          this.chestOverlay.chooseIndex(index);
          return;
        }

        this.levelUpOverlay.chooseIndex(index);
      }
    });
  }

  handleStatsToggle() {
    if (Phaser.Input.Keyboard.JustDown(this.statsKey)) {
      this.damageStatsOverlay.toggle();
    }
  }

  handleUpgradeSelected(choice) {
    this.upgradeSystem.apply(this.player, choice.key);
    this.damageStatsManager.syncUnlockedWeapons(this.player.stats, this.elapsedMs);
    this.syncAbilityDiscoveries();
    this.levelUpOverlay.hide();
    this.activePauseOverlay = null;

    if (!this.isGameOver) {
      this.physics.world.resume();
      this.isGameplayPaused = false;
    }

    this.refreshHud();
  }

  handleChestRewardSelected(reward) {
    this.chestRewardSystem.apply(this.player, reward, this.pickupManager);
    this.damageStatsManager.syncUnlockedWeapons(this.player.stats, this.elapsedMs);
    this.syncAbilityDiscoveries();
    this.chestOverlay.hide();
    this.activePauseOverlay = null;
    this.pendingChestPickup = null;

    if (!this.isGameOver) {
      this.physics.world.resume();
      this.isGameplayPaused = false;
    }

    this.refreshHud();
  }

  openGameOver() {
    this.isGameOver = true;
    this.isGameplayPaused = true;
    this.activePauseOverlay = null;
    this.audioManager?.playGameOver?.();
    this.physics.world.pause();
    this.player.stop();
    this.enemyManager.stopAll();
    this.projectileManager.stopAll();
    this.levelUpOverlay.hide();
    this.chestOverlay.hide();
    this.bossOverlay?.hide?.();
    this.journalOverlay?.hide?.();
    this.gameOverOverlay.show({
      timeMs: this.elapsedMs,
      level: this.player.stats.level
    });
  }

  restartRun() {
    this.levelUpOverlay?.hide?.();
    this.chestOverlay?.hide?.();
    this.gameOverOverlay?.hide?.();
    this.bossOverlay?.hide?.();
    this.journalOverlay?.hide?.();
    this.physics?.world?.resume?.();
    this.activePauseOverlay = null;
    this.isGameplayPaused = false;
    this.isGameOver = false;

    if (this.scene?.restart) {
      this.scene.restart();
      return;
    }

    this.scene.start(this.sys?.settings?.key ?? 'game');
  }

  refreshHud(enemyCount = this.enemyManager.getLivingEnemies().length) {
    const damageRows = this.damageStatsManager.getRows(this.elapsedMs);
    const tooltipMap = buildWeaponTooltipMap(this.player.stats);

    this.hud.update({
      health: this.player.stats.health,
      maxHealth: this.player.stats.maxHealth,
      level: this.player.stats.level,
      xp: this.player.stats.xp,
      xpToNext: this.player.stats.xpToNext,
      timeMs: this.elapsedMs,
      enemyCount,
      projectileCount: this.player.stats.projectileCount,
      bladeCount: this.player.stats.bladeCount,
      activeWeapons: countLearnedAbilities(this.player.stats),
      eliteWarning: this.eliteWaveSystem.isWarningActive(this.elapsedMs) ? 'Elite wave incoming' : ''
    });
    this.bossOverlay?.update?.(
      buildBossOverlayState({
        activeBoss: this.enemyManager.getActiveBoss?.() ?? null,
        elapsedMs: this.elapsedMs,
        bossSystem: this.bossSystem
      })
    );
    this.powerupHud?.update(this.temporaryBuffSystem?.getSummaryRows?.(this.elapsedMs) ?? []);
    this.damageStatsOverlay.update(damageRows, tooltipMap);
    if (this.journalOverlay?.isVisible?.()) {
      this.refreshJournalOverlay();
    }
  }

  updateFpsCounter(now) {
    if (!this.fpsCounter || now < this.nextFpsUpdateAt) {
      return;
    }

    this.nextFpsUpdateAt = now + 200;
    this.fpsCounter.update(this.game.loop.actualFps);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.syncBackgroundTiles?.();

    if (this.hud) {
      this.currentXpBarBounds = this.hud.layout(width, height);
    }

    if (this.fpsCounter) {
      this.fpsCounter.layout(width, height);
    }

    if (this.powerupHud) {
      this.powerupHud.layout(width, height, this.currentXpBarBounds);
    }

    if (this.bossOverlay) {
      this.bossOverlay.layout(width, height);
    }

    this.layoutPowerupCompassIndicators?.();

    if (this.damageStatsOverlay) {
      this.damageStatsOverlay.layout(width, height);
    }

    if (this.journalOverlay) {
      this.journalOverlay.layout(width, height);
    }

    if (this.levelUpOverlay) {
      this.levelUpOverlay.layout(width, height);
    }

    if (this.chestOverlay) {
      this.chestOverlay.layout(width, height);
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
    const generateMobTexture = (key, width, height, drawFrame) => {
      if (this.textures?.exists?.(key)) {
        return;
      }

      graphics.clear();
      drawFrame(graphics);
      graphics.generateTexture(key, width, height);
    };
    const drawLimb = (x1, y1, x2, y2, color = 0x22150f, alpha = 1, width = 3) => {
      graphics.lineStyle(width, color, alpha);
      graphics.lineBetween(x1, y1, x2, y2);
    };
    const drawEye = (x, y, color = 0xffffff) => {
      graphics.fillStyle(color, 1);
      graphics.fillCircle(x, y, 1.4);
    };
    const createZombieFrame = (frame) => {
      generateMobTexture(`mob-zombie-${frame}`, 28, 28, () => {
        const bob = frame === 1 ? 1 : 0;
        const armSwing = frame === 0 ? -2 : frame === 2 ? 2 : 0;
        const legSwing = frame === 0 ? 2 : frame === 2 ? -2 : 0;

        graphics.fillStyle(0x365d2f, 1);
        graphics.fillEllipse(14, 13 + bob, 16, 18);
        graphics.fillStyle(0x89b36b, 1);
        graphics.fillCircle(14, 8 + bob, 7);
        graphics.fillStyle(0x516a4d, 1);
        graphics.fillRect(8, 15 + bob, 12, 7);
        drawEye(11.5, 7.5 + bob, 0xf4f0ce);
        drawEye(16.5, 7.5 + bob, 0xf4f0ce);
        drawLimb(8, 14 + bob, 4 + armSwing, 18 + bob, 0x89b36b);
        drawLimb(20, 14 + bob, 24 + armSwing, 18 + bob, 0x89b36b);
        drawLimb(11, 21 + bob, 9 + legSwing, 26 + bob, 0x2b241e);
        drawLimb(17, 21 + bob, 19 - legSwing, 26 + bob, 0x2b241e);
      });
    };
    const createSkeletonFrame = (frame) => {
      generateMobTexture(`mob-skeleton-${frame}`, 26, 28, () => {
        const bob = frame === 1 ? 1 : 0;
        const armSwing = frame === 0 ? -2 : frame === 2 ? 2 : 0;
        const legSwing = frame === 0 ? 2 : frame === 2 ? -2 : 0;

        graphics.fillStyle(0xe6e1d4, 1);
        graphics.fillCircle(13, 7 + bob, 6);
        graphics.fillRect(10, 12 + bob, 6, 8);
        graphics.fillRect(8, 15 + bob, 10, 3);
        graphics.fillStyle(0x2a2020, 1);
        graphics.fillCircle(11, 6 + bob, 1.2);
        graphics.fillCircle(15, 6 + bob, 1.2);
        graphics.fillRect(11, 9 + bob, 4, 1);
        drawLimb(8, 15 + bob, 4 + armSwing, 20 + bob, 0xe6e1d4, 1, 2);
        drawLimb(18, 15 + bob, 22 + armSwing, 20 + bob, 0xe6e1d4, 1, 2);
        drawLimb(11, 20 + bob, 9 + legSwing, 26 + bob, 0xe6e1d4, 1, 2);
        drawLimb(15, 20 + bob, 17 - legSwing, 26 + bob, 0xe6e1d4, 1, 2);
      });
    };
    const createBatFrame = (frame) => {
      generateMobTexture(`mob-bat-${frame}`, 30, 24, () => {
        const wingLift = frame === 0 ? -6 : frame === 2 ? 3 : -1;
        const bodyOffset = frame === 1 ? -1 : 0;

        graphics.fillStyle(0x49385d, 1);
        graphics.fillEllipse(15, 12 + bodyOffset, 10, 8);
        graphics.fillCircle(12, 9 + bodyOffset, 3);
        graphics.fillCircle(18, 9 + bodyOffset, 3);
        graphics.fillStyle(0xc74d55, 1);
        graphics.fillTriangle(13, 15 + bodyOffset, 17, 15 + bodyOffset, 15, 19 + bodyOffset);
        graphics.fillStyle(0x342640, 1);
        graphics.fillTriangle(11, 10 + bodyOffset, 1, 12 + wingLift, 9, 18 + bodyOffset);
        graphics.fillTriangle(19, 10 + bodyOffset, 29, 12 + wingLift, 21, 18 + bodyOffset);
        drawEye(12.5, 9 + bodyOffset, 0xf5d66a);
        drawEye(17.5, 9 + bodyOffset, 0xf5d66a);
      });
    };
    const createOrcFrame = (frame) => {
      generateMobTexture(`mob-orc-${frame}`, 34, 34, () => {
        const bob = frame === 1 ? 1 : 0;
        const armSwing = frame === 0 ? -2 : frame === 2 ? 2 : 0;
        const legSwing = frame === 0 ? 2 : frame === 2 ? -2 : 0;

        graphics.fillStyle(0x4b8a36, 1);
        graphics.fillCircle(17, 10 + bob, 8);
        graphics.fillStyle(0x6e4027, 1);
        graphics.fillRect(10, 17 + bob, 14, 10);
        graphics.fillStyle(0x768c46, 1);
        graphics.fillRect(12, 15 + bob, 10, 4);
        graphics.fillStyle(0xf3e4c0, 1);
        graphics.fillRect(11, 11 + bob, 2, 3);
        graphics.fillRect(21, 11 + bob, 2, 3);
        graphics.fillStyle(0x181512, 1);
        graphics.fillRect(13, 8 + bob, 3, 2);
        graphics.fillRect(18, 8 + bob, 3, 2);
        drawLimb(11, 18 + bob, 6 + armSwing, 24 + bob, 0x4b8a36, 1, 4);
        drawLimb(23, 18 + bob, 28 + armSwing, 24 + bob, 0x4b8a36, 1, 4);
        drawLimb(14, 27 + bob, 12 + legSwing, 33 + bob, 0x332116, 1, 4);
        drawLimb(20, 27 + bob, 22 - legSwing, 33 + bob, 0x332116, 1, 4);
      });
    };
    const createOgreFrame = (frame) => {
      generateMobTexture(`mob-ogre-${frame}`, 40, 40, () => {
        const bob = frame === 1 ? 1 : 0;
        const armSwing = frame === 0 ? -3 : frame === 2 ? 3 : 0;
        const legSwing = frame === 0 ? 2 : frame === 2 ? -2 : 0;

        graphics.fillStyle(0x7d8e58, 1);
        graphics.fillCircle(20, 12 + bob, 10);
        graphics.fillStyle(0x7f4f38, 1);
        graphics.fillEllipse(20, 25 + bob, 20, 16);
        graphics.fillStyle(0x5d3527, 1);
        graphics.fillRect(10, 23 + bob, 20, 7);
        graphics.fillStyle(0xfff0d0, 1);
        graphics.fillRect(12, 14 + bob, 3, 4);
        graphics.fillRect(25, 14 + bob, 3, 4);
        graphics.fillStyle(0x1f1a15, 1);
        graphics.fillRect(15, 10 + bob, 4, 3);
        graphics.fillRect(21, 10 + bob, 4, 3);
        drawLimb(11, 22 + bob, 4 + armSwing, 31 + bob, 0x7d8e58, 1, 5);
        drawLimb(29, 22 + bob, 36 + armSwing, 31 + bob, 0x7d8e58, 1, 5);
        drawLimb(15, 31 + bob, 13 + legSwing, 39 + bob, 0x463228, 1, 5);
        drawLimb(25, 31 + bob, 27 - legSwing, 39 + bob, 0x463228, 1, 5);
      });
    };
    const createNecromancerFrame = (frame) => {
      generateMobTexture(`mob-necromancer-${frame}`, 30, 34, () => {
        const bob = frame === 1 ? 1 : 0;
        const sleeveSwing = frame === 0 ? -2 : frame === 2 ? 2 : 0;

        graphics.fillStyle(0x281b36, 1);
        graphics.fillTriangle(15, 8 + bob, 4, 30 + bob, 26, 30 + bob);
        graphics.fillStyle(0x3c2754, 1);
        graphics.fillRect(11, 7 + bob, 8, 8);
        graphics.fillStyle(0xeee7dc, 1);
        graphics.fillCircle(15, 8 + bob, 5);
        graphics.fillStyle(0x23172e, 1);
        graphics.fillCircle(13, 7 + bob, 1.2);
        graphics.fillCircle(17, 7 + bob, 1.2);
        graphics.fillStyle(0x79e1ff, 1);
        graphics.fillCircle(15, 15 + bob, 2.5);
        drawLimb(10, 17 + bob, 5 + sleeveSwing, 24 + bob, 0x281b36, 1, 3);
        drawLimb(20, 17 + bob, 25 + sleeveSwing, 24 + bob, 0x281b36, 1, 3);
      });
    };
    const createPoisonBlobFrame = (frame) => {
      generateMobTexture(`mob-poison-${frame}`, 40, 40, () => {
        const bob = frame === 1 ? -1 : 0;
        const wobbleX = frame === 0 ? -1.5 : frame === 2 ? 1.5 : 0;
        const wobbleY = frame === 0 ? 1 : frame === 2 ? -1 : 0;
        const outerColor = frame === 1 ? 0x8fcf2d : 0x7fb723;
        const innerColor = frame === 1 ? 0x5d9220 : 0x4b7518;
        const coreColor = frame === 1 ? 0x2d4311 : 0x24350d;

        graphics.fillStyle(0x23400f, 0.24);
        graphics.fillEllipse(20, 29, 24, 10);
        graphics.fillStyle(outerColor, 0.92);
        graphics.fillEllipse(20 + wobbleX, 20 + bob, 30, 24);
        graphics.fillEllipse(13 + wobbleX, 18 + wobbleY, 12, 10);
        graphics.fillEllipse(27 + wobbleX, 17 - wobbleY, 13, 11);
        graphics.fillEllipse(15 + wobbleX, 24 + wobbleY, 11, 9);
        graphics.fillEllipse(27 + wobbleX, 24 - wobbleY, 12, 10);
        graphics.fillStyle(innerColor, 0.88);
        graphics.fillEllipse(20 + wobbleX, 21 + bob, 23, 17);
        graphics.fillEllipse(20 + wobbleX, 19 + bob, 16, 11);
        graphics.fillStyle(coreColor, 0.74);
        graphics.fillEllipse(20 + wobbleX, 20 + bob, 13, 10);
        graphics.fillStyle(0xb5ef4a, 0.58);
        graphics.fillEllipse(15 + wobbleX, 14 + wobbleY, 7, 4);
        graphics.fillEllipse(26 + wobbleX, 15 - wobbleY, 6, 4);
        graphics.fillEllipse(22 + wobbleX, 25, 8, 4);
        graphics.fillStyle(0xcdfb79, 0.48);
        graphics.fillCircle(12 + wobbleX, 12 + wobbleY, frame === 1 ? 3.4 : 2.6);
        graphics.fillCircle(29 + wobbleX, 11 - wobbleY, frame === 1 ? 2.8 : 2.1);
        graphics.fillCircle(30 + wobbleX, 24, frame === 0 ? 1.9 : 2.5);
        graphics.fillCircle(15 + wobbleX, 26, frame === 2 ? 2.9 : 2.2);
        graphics.fillStyle(0xffffff, 0.22);
        graphics.fillEllipse(14 + wobbleX, 13 + wobbleY, 4, 2);
        graphics.fillEllipse(26 + wobbleX, 14 - wobbleY, 3.2, 1.8);
      });
    };
    const drawNecromancerBossFrame = ({
      auraAlpha = 0.14,
      auraColor = 0x6c35ad,
      auraRadius = 24,
      bob = 0,
      chestColor = 0x79e1ff,
      chestRadius = 4.6,
      handColor = 0xb58bff,
      hoodLift = 0,
      leftHandX = 14,
      leftHandY = 54,
      outerRingAlpha = 0,
      outerRingRadius = 0,
      rightHandX = 58,
      rightHandY = 54,
      robeColor = 0x281b36,
      shadowAlpha = 0.34,
      trimColor = 0x4c3070
    } = {}) => {
      const faceY = 18 + hoodLift + bob;
      const bodyY = 15 + hoodLift + bob;
      const auraY = 42 + bob;

      graphics.fillStyle(0x120d1d, shadowAlpha);
      graphics.fillEllipse(36, 81 + bob, 34, 14);

      if (auraAlpha > 0) {
        graphics.fillStyle(auraColor, auraAlpha);
        graphics.fillCircle(36, auraY, auraRadius);
      }

      if (outerRingAlpha > 0) {
        graphics.lineStyle(3, 0xe7d5ff, outerRingAlpha);
        graphics.strokeCircle(36, auraY, outerRingRadius);
      }

      graphics.fillStyle(robeColor, 1);
      graphics.fillTriangle(36, 16 + hoodLift + bob, 12, 72 + bob, 60, 72 + bob);
      graphics.fillStyle(trimColor, 0.96);
      graphics.fillTriangle(36, 24 + hoodLift + bob, 22, 68 + bob, 50, 68 + bob);
      graphics.fillStyle(0x38234e, 1);
      graphics.fillRect(26, bodyY, 20, 22);
      graphics.fillStyle(0xeee7dc, 1);
      graphics.fillCircle(36, faceY, 10);
      graphics.fillStyle(0x23172e, 1);
      graphics.fillCircle(32, faceY - 2, 2.3);
      graphics.fillCircle(40, faceY - 2, 2.3);
      graphics.fillStyle(0x79e1ff, 0.98);
      graphics.fillCircle(32, faceY - 2, 1.15);
      graphics.fillCircle(40, faceY - 2, 1.15);
      graphics.fillStyle(chestColor, 0.92);
      graphics.fillCircle(36, 31 + bob, chestRadius);
      graphics.fillStyle(0xffffff, 0.62);
      graphics.fillCircle(34.4, 29.6 + bob, Math.max(1.1, chestRadius * 0.24));
      drawLimb(24, 34 + bob, leftHandX, leftHandY, robeColor, 1, 5);
      drawLimb(48, 34 + bob, rightHandX, rightHandY, robeColor, 1, 5);
      graphics.fillStyle(handColor, 0.82);
      graphics.fillCircle(leftHandX, leftHandY, 3.1);
      graphics.fillCircle(rightHandX, rightHandY, 3.1);
    };

    graphics.clear();
    graphics.fillStyle(0x1d4f7a, 1);
    graphics.fillCircle(14, 14, 14);
    graphics.lineStyle(3, 0xc6ecff, 1);
    graphics.strokeCircle(14, 14, 12);
    graphics.generateTexture('player', 28, 28);

    for (let frame = 0; frame < 3; frame += 1) {
      createZombieFrame(frame);
      createSkeletonFrame(frame);
      createBatFrame(frame);
      createOrcFrame(frame);
      createOgreFrame(frame);
      createNecromancerFrame(frame);
      createPoisonBlobFrame(frame);
    }

    generateMobTexture('boss-necromancer-idle', 72, 92, () => {
      drawNecromancerBossFrame();
    });

    generateMobTexture('boss-necromancer-idle-1', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.16,
        bob: -1,
        chestRadius: 4.2,
        leftHandX: 12,
        leftHandY: 55,
        rightHandX: 56,
        rightHandY: 53
      });
    });

    generateMobTexture('boss-necromancer-idle-2', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.18,
        bob: 1,
        chestRadius: 4.9,
        leftHandX: 16,
        leftHandY: 53,
        rightHandX: 60,
        rightHandY: 55
      });
    });

    generateMobTexture('boss-necromancer-cast', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.2,
        auraRadius: 27,
        chestColor: 0xa8ebff,
        chestRadius: 6.6,
        handColor: 0xdcc5ff,
        leftHandX: 9,
        leftHandY: 38,
        outerRingAlpha: 0.48,
        outerRingRadius: 26,
        rightHandX: 63,
        rightHandY: 38,
        trimColor: 0x6f49a2
      });
    });

    generateMobTexture('boss-necromancer-summon', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.24,
        auraRadius: 29,
        chestColor: 0xc4a1ff,
        chestRadius: 7,
        handColor: 0xf2d8ff,
        hoodLift: -1,
        leftHandX: 6,
        leftHandY: 41,
        outerRingAlpha: 0.54,
        outerRingRadius: 28,
        rightHandX: 66,
        rightHandY: 41,
        trimColor: 0x8b5ad0
      });
      graphics.lineStyle(3, 0xd5b3ff, 0.82);
      graphics.lineBetween(36, 35, 36, 56);
      graphics.lineBetween(25, 46, 47, 46);
    });

    generateMobTexture('boss-necromancer-pulse', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.3,
        auraColor: 0x7b4bd3,
        auraRadius: 31,
        chestColor: 0xe6cbff,
        chestRadius: 7.4,
        handColor: 0xe6cbff,
        leftHandX: 12,
        leftHandY: 48,
        outerRingAlpha: 0.72,
        outerRingRadius: 31,
        rightHandX: 60,
        rightHandY: 48,
        trimColor: 0x9a6de2
      });
      graphics.lineStyle(2, 0x79e1ff, 0.9);
      graphics.strokeCircle(36, 42, 18);
    });

    generateMobTexture('boss-necromancer-death', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.08,
        auraColor: 0xa63d63,
        auraRadius: 22,
        bob: 2,
        chestColor: 0xffb1d8,
        chestRadius: 5.6,
        handColor: 0xffd4ea,
        leftHandX: 19,
        leftHandY: 60,
        outerRingAlpha: 0.36,
        outerRingRadius: 23,
        rightHandX: 53,
        rightHandY: 60,
        robeColor: 0x37213c,
        shadowAlpha: 0.42,
        trimColor: 0x7d4562
      });
      graphics.lineStyle(3, 0xffc4de, 0.62);
      graphics.lineBetween(28, 46, 44, 62);
      graphics.lineBetween(44, 46, 28, 62);
    });

    generateMobTexture('boss-necromancer-fallback-idle', 72, 92, () => {
      drawNecromancerBossFrame({
        auraAlpha: 0.12,
        auraRadius: 22,
        chestRadius: 4.2,
        trimColor: 0x5a3c7a
      });
    });

    generateMobTexture('boss-necromancer-portrait', 92, 120, () => {
      graphics.fillStyle(0x1a1028, 1);
      graphics.fillEllipse(46, 102, 32, 12);
      graphics.fillStyle(0x2a173f, 1);
      graphics.fillCircle(46, 36, 28);
      graphics.fillStyle(0x4d2d69, 1);
      graphics.fillEllipse(46, 60, 38, 54);
      graphics.fillStyle(0xeee7dc, 1);
      graphics.fillCircle(46, 40, 18);
      graphics.fillStyle(0x23172e, 1);
      graphics.fillCircle(40, 38, 3.5);
      graphics.fillCircle(52, 38, 3.5);
      graphics.fillStyle(0x79e1ff, 1);
      graphics.fillCircle(46, 58, 7);
    });

    generateMobTexture('boss-necro-aura', 96, 96, () => {
      graphics.fillStyle(0x4f2a83, 0.16);
      graphics.fillCircle(48, 48, 40);
      graphics.fillStyle(0x7b4bd3, 0.28);
      graphics.fillCircle(48, 48, 30);
      graphics.fillStyle(0xb58bff, 0.42);
      graphics.fillCircle(48, 48, 18);
      graphics.lineStyle(4, 0xe7d5ff, 0.5);
      graphics.strokeCircle(48, 48, 38);
    });

    generateMobTexture('boss-necro-eyes', 96, 96, () => {
      graphics.fillStyle(0x4f2a83, 0.08);
      graphics.fillCircle(48, 40, 22);
      graphics.fillStyle(0x79e1ff, 0.96);
      graphics.fillEllipse(39, 39, 11, 6);
      graphics.fillEllipse(57, 39, 11, 6);
      graphics.fillStyle(0xffffff, 0.76);
      graphics.fillCircle(36, 38, 1.7);
      graphics.fillCircle(54, 38, 1.7);
      graphics.lineStyle(2, 0xcdefff, 0.64);
      graphics.strokeCircle(48, 40, 17);
    });

    generateMobTexture('boss-necro-chest', 96, 96, () => {
      graphics.fillStyle(0x30184b, 0.1);
      graphics.fillCircle(48, 56, 26);
      graphics.fillStyle(0x79e1ff, 0.88);
      graphics.fillCircle(48, 56, 10);
      graphics.fillStyle(0xffffff, 0.62);
      graphics.fillCircle(45, 52, 2.2);
      graphics.lineStyle(3, 0xd8c3ff, 0.72);
      graphics.strokeCircle(48, 56, 16);
      graphics.lineStyle(2, 0x9ce8ff, 0.78);
      graphics.lineBetween(48, 39, 48, 73);
      graphics.lineBetween(36, 56, 60, 56);
    });

    generateMobTexture('boss-necro-summon-burst', 96, 96, () => {
      graphics.fillStyle(0x1a1028, 0.12);
      graphics.fillCircle(48, 54, 18);
      graphics.fillStyle(0x6c35ad, 0.9);
      graphics.fillTriangle(48, 12, 20, 72, 76, 72);
      graphics.fillStyle(0xf0d7ff, 0.8);
      graphics.fillTriangle(48, 22, 30, 70, 66, 70);
      graphics.fillStyle(0x79e1ff, 0.74);
      graphics.fillCircle(48, 44, 8);
      graphics.lineStyle(4, 0xb78dff, 0.82);
      graphics.strokeCircle(48, 48, 30);
    });

    generateMobTexture('boss-necro-pulse-ring', 128, 128, () => {
      graphics.fillStyle(0x1a1028, 0.08);
      graphics.fillCircle(64, 64, 22);
      graphics.lineStyle(8, 0x7b4bd3, 0.3);
      graphics.strokeCircle(64, 64, 48);
      graphics.lineStyle(4, 0xe7d5ff, 0.72);
      graphics.strokeCircle(64, 64, 34);
      graphics.lineStyle(2, 0x79e1ff, 0.9);
      graphics.strokeCircle(64, 64, 18);
    });

    const magicMissileSpec = getMagicMissileTextureSpec();
    graphics.clear();
    magicMissileSpec.glows.forEach((glow) => {
      graphics.fillStyle(glow.color, glow.alpha);
      graphics.fillCircle(glow.x, glow.y, glow.radius);
    });
    magicMissileSpec.spikes.forEach((spike) => {
      graphics.fillStyle(spike.color, spike.alpha);
      graphics.fillTriangle(...spike.points);
    });
    graphics.fillStyle(magicMissileSpec.core.color, magicMissileSpec.core.alpha);
    graphics.fillCircle(
      magicMissileSpec.core.x,
      magicMissileSpec.core.y,
      magicMissileSpec.core.radius
    );
    graphics.generateTexture('projectile', magicMissileSpec.width, magicMissileSpec.height);

    graphics.clear();
    graphics.fillStyle(0x8e5b33, 0.32);
    graphics.fillEllipse(8.3, 6.1, 9.2, 4.4);
    graphics.fillStyle(0xbd7b47, 1);
    graphics.fillEllipse(4.3, 5, 5.6, 6);
    graphics.fillRect(4.3, 2, 7.8, 6);
    graphics.fillEllipse(12.1, 5, 4.2, 6);
    graphics.fillStyle(0xe2a06c, 0.9);
    graphics.fillEllipse(5.1, 3.2, 3.4, 1.2);
    graphics.fillRect(5.1, 2.6, 7.1, 1.2);
    graphics.fillStyle(0x2d231f, 1);
    graphics.fillEllipse(13.8, 5, 3.2, 5.2);
    graphics.fillStyle(0xf4c293, 0.72);
    graphics.fillRect(3.1, 3.2, 0.9, 3.4);
    graphics.lineStyle(1, 0x9f6336, 0.75);
    graphics.lineBetween(9.8, 2.2, 9.8, 7.8);
    graphics.generateTexture('burst-rifle-projectile', 16, 10);

    graphics.clear();
    graphics.fillStyle(0x432060, 0.34);
    graphics.fillCircle(10, 10, 9);
    graphics.fillStyle(0x8a52d6, 0.9);
    graphics.fillCircle(10, 10, 6.3);
    graphics.fillStyle(0xf0ddff, 0.92);
    graphics.fillCircle(10, 10, 3.2);
    graphics.lineStyle(2, 0xd1aaff, 0.86);
    graphics.lineBetween(10, 2, 10, 18);
    graphics.lineBetween(2, 10, 18, 10);
    graphics.lineBetween(4, 4, 16, 16);
    graphics.lineBetween(16, 4, 4, 16);
    graphics.generateTexture('boss-dark-bolt', 20, 20);

    const drawBossBurstTexture = (
      key,
      {
        coreAlpha = 0.92,
        coreColor,
        coreRadius,
        glowAlpha = 0.18,
        glowColor,
        glowRadius,
        lineWidth = 2,
        outerRadius,
        ringAlpha = 0.9,
        ringColor,
        ringRadius,
        size,
        spikeAlpha = 0.82,
        spikeColor = ringColor,
        spikeCount = 8,
        spikeInset = 0.62,
        spikeLength = 12
      }
    ) => {
      const center = size / 2;

      graphics.clear();
      graphics.fillStyle(glowColor, glowAlpha);
      graphics.fillCircle(center, center, glowRadius);
      graphics.fillStyle(coreColor, coreAlpha);
      graphics.fillCircle(center, center, coreRadius);
      graphics.lineStyle(lineWidth, ringColor, ringAlpha);
      graphics.strokeCircle(center, center, ringRadius);
      graphics.lineStyle(lineWidth, spikeColor, spikeAlpha);

      for (let index = 0; index < spikeCount; index += 1) {
        const angle = (Math.PI * 2 * index) / spikeCount;
        const innerX = center + Math.cos(angle) * (outerRadius * spikeInset);
        const innerY = center + Math.sin(angle) * (outerRadius * spikeInset);
        const outerX = center + Math.cos(angle) * (ringRadius + spikeLength);
        const outerY = center + Math.sin(angle) * (ringRadius + spikeLength);

        graphics.lineBetween(innerX, innerY, outerX, outerY);
      }

      graphics.generateTexture(key, size, size);
    };

    drawBossBurstTexture('boss-necro-death-burst', {
      coreAlpha: 0.88,
      coreColor: 0x4b0d2b,
      coreRadius: 14,
      glowAlpha: 0.2,
      glowColor: 0xc34b87,
      glowRadius: 30,
      outerRadius: 20,
      ringAlpha: 0.92,
      ringColor: 0xff9fd0,
      ringRadius: 28,
      size: 96,
      spikeAlpha: 0.9,
      spikeColor: 0xffd4ea,
      spikeCount: 6,
      spikeInset: 0.58,
      spikeLength: 16
    });

    graphics.clear();
    graphics.fillStyle(0xd9f2ff, 1);
    graphics.fillTriangle(6, 20, 14, 0, 22, 20);
    graphics.generateTexture('blade', 28, 22);

    graphics.clear();
    graphics.fillStyle(0xffb56c, 1);
    graphics.fillTriangle(2, 14, 14, 2, 26, 14);
    graphics.lineStyle(2, 0xfff2cb, 1);
    graphics.strokeTriangle(2, 14, 14, 2, 26, 14);
    graphics.generateTexture('boomerang', 28, 16);

    graphics.clear();
    graphics.lineStyle(4, 0x9deaff, 0.95);
    graphics.strokeCircle(20, 20, 16);
    graphics.generateTexture('nova-ring', 40, 40);

    graphics.clear();
    graphics.fillStyle(0x2b313a, 0.96);
    graphics.fillRect(16, 12, 112, 4);
    graphics.fillStyle(0x48515d, 0.9);
    graphics.fillRect(20, 10, 104, 2);
    graphics.fillStyle(0xc6edf6, 0.98);
    graphics.fillTriangle(126, 7, 178, 14, 126, 21);
    graphics.fillStyle(0xeffbff, 0.82);
    graphics.fillTriangle(132, 10, 170, 14, 132, 18);
    graphics.lineStyle(2, 0xa9f1ff, 0.82);
    graphics.lineBetween(118, 14, 138, 4);
    graphics.lineBetween(118, 14, 138, 24);
    graphics.generateTexture('lance-strike', 180, 28);

    graphics.clear();
    graphics.fillStyle(0x7ce4ff, 0.18);
    graphics.fillEllipse(78, 12, 136, 12);
    graphics.fillStyle(0xc1f6ff, 0.14);
    graphics.fillEllipse(96, 12, 96, 8);
    graphics.generateTexture('lance-trail', 180, 24);

    graphics.clear();
    graphics.fillStyle(0xffe18b, 0.85);
    graphics.fillCircle(16, 16, 10);
    graphics.lineStyle(2, 0xff7d5f, 1);
    graphics.strokeCircle(16, 16, 14);
    graphics.generateTexture('meteor-marker', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xff4f2b, 0.9);
    graphics.fillEllipse(11, 66, 14, 18);
    graphics.fillStyle(0xffc469, 0.95);
    graphics.fillEllipse(12, 63, 10, 14);
    graphics.fillStyle(0xfff5d8, 0.92);
    graphics.fillEllipse(13, 60, 5, 8);
    graphics.fillStyle(0xffc47f, 0.22);
    graphics.fillTriangle(6, 56, 27, 6, 18, 57);
    graphics.fillStyle(0xfff3cf, 0.2);
    graphics.fillTriangle(10, 54, 31, 8, 20, 56);
    graphics.fillStyle(0xff7f57, 0.16);
    graphics.fillTriangle(2, 58, 20, 0, 12, 58);
    graphics.generateTexture('meteor-fall', 40, 80);

    graphics.clear();
    graphics.fillStyle(0xff6e3b, 0.26);
    graphics.fillCircle(48, 48, 40);
    graphics.fillStyle(0xff9d4d, 0.42);
    graphics.fillCircle(48, 48, 28);
    graphics.fillStyle(0xffcf7b, 0.68);
    graphics.fillCircle(48, 48, 18);
    graphics.fillStyle(0xfff1c9, 0.9);
    graphics.fillCircle(48, 48, 10);
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(48, 48, 5);
    graphics.generateTexture('meteor-explosion', 96, 96);

    graphics.clear();
    graphics.lineStyle(3, 0xffd3a4, 0.82);
    graphics.strokeCircle(22, 22, 16);
    graphics.lineStyle(1, 0xffa36d, 0.42);
    graphics.strokeCircle(22, 22, 20);
    graphics.generateTexture('spear-barrage-marker', 44, 44);

    graphics.clear();
    graphics.fillStyle(0xe2e5ea, 0.98);
    graphics.fillTriangle(22, 0, 14, 28, 30, 28);
    graphics.fillStyle(0x9aa0aa, 0.92);
    graphics.fillTriangle(22, 8, 17, 28, 27, 28);
    graphics.fillStyle(0x343942, 1);
    graphics.fillRect(20, 28, 4, 132);
    graphics.lineStyle(3, 0xd2d5dc, 0.92);
    graphics.lineBetween(22, 30, 8, 58);
    graphics.lineBetween(22, 30, 36, 58);
    graphics.generateTexture('spear-barrage-fall', 44, 180);

    graphics.clear();
    graphics.fillStyle(0x120a08, 0.12);
    graphics.fillTriangle(22, 6, 14, 34, 30, 34);
    graphics.fillRect(19, 34, 6, 118);
    graphics.fillEllipse(22, 152, 12, 30);
    graphics.fillStyle(0x2b1c18, 0.08);
    graphics.fillTriangle(22, 14, 10, 42, 34, 42);
    graphics.fillRect(17, 38, 10, 112);
    graphics.generateTexture('spear-barrage-shadow', 44, 180);

    graphics.clear();
    graphics.fillStyle(0xffcc8d, 0.18);
    graphics.fillCircle(44, 44, 30);
    graphics.lineStyle(4, 0xffe2b8, 0.86);
    graphics.strokeCircle(44, 44, 18);
    graphics.lineStyle(2, 0xff9e6d, 0.82);
    graphics.lineBetween(44, 10, 44, 78);
    graphics.lineBetween(10, 44, 78, 44);
    graphics.generateTexture('spear-barrage-impact', 88, 88);

    graphics.clear();
    graphics.fillStyle(0x392157, 0.95);
    graphics.fillCircle(16, 16, 11);
    graphics.lineStyle(2, 0xc68bff, 0.9);
    graphics.strokeCircle(16, 16, 13);
    graphics.lineStyle(2, 0xf4ceff, 0.9);
    graphics.lineBetween(16, 4, 16, 28);
    graphics.lineBetween(4, 16, 28, 16);
    graphics.lineBetween(8, 8, 24, 24);
    graphics.lineBetween(24, 8, 8, 24);
    graphics.generateTexture('rune-trap', 32, 32);

    graphics.clear();
    graphics.fillStyle(0x120709, 0.35);
    graphics.fillCircle(20, 20, 16);
    graphics.fillStyle(0x3b050c, 0.46);
    graphics.fillCircle(18, 18, 13);
    graphics.lineStyle(3, 0xc02735, 0.92);
    graphics.strokeCircle(18, 18, 11);
    graphics.lineStyle(2, 0x6f0f18, 0.62);
    graphics.strokeCircle(18, 18, 14);
    graphics.lineStyle(2, 0xe6a6a6, 0.8);
    graphics.beginPath();
    graphics.moveTo(18, 5);
    graphics.lineTo(23, 12);
    graphics.lineTo(31, 14);
    graphics.lineTo(25, 19);
    graphics.lineTo(27, 29);
    graphics.lineTo(18, 24);
    graphics.lineTo(9, 29);
    graphics.lineTo(11, 19);
    graphics.lineTo(5, 14);
    graphics.lineTo(13, 12);
    graphics.lineTo(18, 5);
    graphics.strokePath();
    graphics.lineStyle(2, 0xffd2c1, 0.75);
    graphics.beginPath();
    graphics.moveTo(18, 8);
    graphics.lineTo(18, 28);
    graphics.moveTo(8, 18);
    graphics.lineTo(28, 18);
    graphics.moveTo(11, 11);
    graphics.lineTo(25, 25);
    graphics.moveTo(25, 11);
    graphics.lineTo(11, 25);
    graphics.strokePath();
    graphics.fillStyle(0xff6f7e, 0.88);
    graphics.fillCircle(18, 18, 4.4);
    graphics.fillStyle(0x2a0408, 0.54);
    graphics.fillEllipse(18, 18, 9, 6);
    graphics.generateTexture('rune-trap-burst', 36, 36);

    graphics.clear();
    graphics.fillStyle(0x1d2143, 0.98);
    graphics.fillCircle(18, 18, 13);
    graphics.fillStyle(0x6578ff, 0.34);
    graphics.fillCircle(18, 18, 15);
    graphics.lineStyle(2, 0xd2e7ff, 0.86);
    graphics.strokeCircle(18, 18, 11);
    graphics.lineStyle(2, 0x9c7aff, 0.9);
    graphics.beginPath();
    graphics.moveTo(18, 6);
    graphics.lineTo(13, 14);
    graphics.lineTo(20, 16);
    graphics.lineTo(14, 27);
    graphics.lineTo(23, 19);
    graphics.lineTo(17, 18);
    graphics.lineTo(23, 9);
    graphics.strokePath();
    graphics.fillStyle(0xebf7ff, 0.78);
    graphics.fillCircle(14, 12, 2.2);
    graphics.generateTexture('arc-mine', 36, 36);

    graphics.clear();
    const wallSpec = getCobbleWallTextureSpec();
    graphics.fillStyle(wallSpec.background.color, wallSpec.background.alpha);
    graphics.fillRect(
      wallSpec.background.x,
      wallSpec.background.y,
      wallSpec.background.width,
      wallSpec.background.height
    );
    wallSpec.highlightRects.forEach((rect) => {
      graphics.fillStyle(rect.color, rect.alpha);
      graphics.fillRect(rect.x, rect.y, rect.width, rect.height);
    });
    wallSpec.shadowRects.forEach((rect) => {
      graphics.fillStyle(rect.color, rect.alpha);
      graphics.fillRect(rect.x, rect.y, rect.width, rect.height);
    });
    graphics.lineStyle(
      wallSpec.outerStroke.lineWidth,
      wallSpec.outerStroke.color,
      wallSpec.outerStroke.alpha
    );
    graphics.strokeRect(
      wallSpec.outerStroke.x,
      wallSpec.outerStroke.y,
      wallSpec.outerStroke.width,
      wallSpec.outerStroke.height
    );
    graphics.lineStyle(
      wallSpec.innerStroke.lineWidth,
      wallSpec.innerStroke.color,
      wallSpec.innerStroke.alpha
    );
    graphics.strokeRect(
      wallSpec.innerStroke.x,
      wallSpec.innerStroke.y,
      wallSpec.innerStroke.width,
      wallSpec.innerStroke.height
    );
    graphics.generateTexture('cobble-wall', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xa11724, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('blood-drop', 10, 10);

    const drawBloodPuddleVariant = (variant) => {
      const createSeededRng = (seed) => {
        let value = (seed + 1) >>> 0;
        return () => {
          value = (value * 1664525 + 1013904223) >>> 0;
          return value / 4294967296;
        };
      };
      const rng = createSeededRng(variant * 131);
      const width = 64;
      const height = 48;
      const centerX = 32;
      const centerY = 22;
      const lobeCount = 6 + Math.floor(rng() * 3);
      const dripCount = 1 + Math.floor(rng() * 3);

      graphics.clear();
      graphics.fillStyle(0x8d0f14, 0.86);
      graphics.fillEllipse(centerX, centerY, 30, 18);

      for (let index = 0; index < lobeCount; index += 1) {
        const angle = rng() * Math.PI * 2;
        const distance = 8 + rng() * 14;
        const radiusX = 7 + rng() * 9;
        const radiusY = 6 + rng() * 8;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * (distance * 0.58);

        graphics.fillStyle(0xb9141a, 0.84);
        graphics.fillEllipse(x, y, radiusX * 2, radiusY * 2);
      }

      for (let drip = 0; drip < dripCount; drip += 1) {
        const dripX = 16 + rng() * 32;
        const dripHeight = 8 + rng() * 16;
        const dripWidth = 6 + rng() * 5;
        const dripTop = 20 + rng() * 6;
        const dripBottomY = Math.min(height - 6, dripTop + dripHeight);

        graphics.fillStyle(0xb50f18, 0.82);
        graphics.fillRect(dripX - dripWidth / 2, dripTop, dripWidth, dripBottomY - dripTop);
        graphics.fillEllipse(dripX, dripTop, dripWidth + 4, 8 + rng() * 3);
        graphics.fillEllipse(dripX, dripBottomY, dripWidth + 4, dripWidth + 6);
      }

      graphics.fillStyle(0xdb3034, 0.36);
      for (let highlight = 0; highlight < 4; highlight += 1) {
        const x = 16 + rng() * 32;
        const y = 10 + rng() * 18;
        graphics.fillEllipse(x, y, 5 + rng() * 6, 2 + rng() * 3);
      }

      graphics.fillStyle(0xffffff, 0.2);
      for (let glint = 0; glint < 3; glint += 1) {
        const x = 14 + rng() * 36;
        const y = 9 + rng() * 20;
        const radius = 1.2 + rng() * 1.8;
        graphics.fillCircle(x, y, radius);
      }

      graphics.generateTexture(`blood-puddle-${variant}`, width, height);
    };

    for (let variant = 0; variant < 8; variant += 1) {
      drawBloodPuddleVariant(variant);
    }

    graphics.clear();
    graphics.fillStyle(0x142509, 0.3);
    graphics.fillEllipse(20, 26, 24, 12);
    graphics.fillStyle(0x487f16, 0.42);
    graphics.fillEllipse(20, 20, 24, 18);
    graphics.fillEllipse(12, 18, 8, 6);
    graphics.fillEllipse(28, 21, 9, 7);
    graphics.fillStyle(0x7fd02b, 0.34);
    graphics.fillEllipse(20, 20, 17, 11);
    graphics.fillEllipse(15, 15, 6, 4);
    graphics.fillEllipse(26, 16, 5, 3);
    graphics.fillStyle(0xc5f77b, 0.18);
    graphics.fillCircle(14, 15, 2.4);
    graphics.fillCircle(27, 16, 1.8);
    graphics.generateTexture('poison-puddle', 40, 40);

    const drawFlamePuff = (key, variant) => {
      graphics.clear();
      graphics.fillStyle(0x943010, 0.26);
      graphics.fillEllipse(15, 16, 18 + variant * 2, 14 + variant);
      graphics.fillStyle(0xff6a1f, 0.88);
      graphics.fillCircle(14, 14, 10 + variant);
      graphics.fillStyle(0xffb23f, 0.92);
      graphics.fillCircle(13, 13, 7 + variant * 0.5);
      graphics.fillStyle(0xfff1b8, 0.95);
      graphics.fillEllipse(11, 11, 9, 6);
      graphics.fillStyle(0xffffff, 0.72);
      graphics.fillEllipse(9, 9, 5, 3);
      graphics.generateTexture(key, 28, 28);
    };

    for (let variant = 0; variant < 3; variant += 1) {
      drawFlamePuff(`flame-puff-${variant}`, variant);
    }

    graphics.clear();
    graphics.fillStyle(0x3b3029, 0.2);
    graphics.fillCircle(14, 14, 10);
    graphics.fillStyle(0x5b5149, 0.24);
    graphics.fillCircle(14, 14, 8);
    graphics.fillStyle(0x8a7e73, 0.18);
    graphics.fillEllipse(12, 12, 14, 10);
    graphics.generateTexture('flame-smoke-0', 28, 28);

    graphics.clear();
    graphics.fillStyle(0x0f5c7e, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0x1189b6, 0.98);
    graphics.fillCircle(8, 8, 6.8);
    graphics.fillStyle(0x40d9ff, 0.94);
    graphics.fillCircle(7, 7, 5.2);
    graphics.fillStyle(0x8ff6ff, 0.65);
    graphics.fillEllipse(5.2, 4.8, 5.8, 3.8);
    graphics.fillStyle(0xffffff, 0.84);
    graphics.fillCircle(4.6, 4.5, 1.3);
    graphics.fillCircle(6.8, 3.8, 0.6);
    graphics.fillStyle(0x04283d, 0.34);
    graphics.fillEllipse(10.2, 10.8, 6.2, 4.4);
    graphics.lineStyle(1, 0xbdf7ff, 0.95);
    graphics.strokeCircle(8, 8, 7.1);
    graphics.generateTexture('xp-orb', 16, 16);

    graphics.clear();
    graphics.fillStyle(0xe85f73, 1);
    graphics.fillCircle(8, 9, 4);
    graphics.fillCircle(13, 9, 4);
    graphics.fillTriangle(4, 11, 17, 11, 10.5, 18);
    graphics.lineStyle(1, 0xffd6dc, 0.85);
    graphics.strokeTriangle(4, 11, 17, 11, 10.5, 18);
    graphics.generateTexture('heart-pickup', 21, 20);

    graphics.clear();
    graphics.fillStyle(0x8b5a2b, 1);
    graphics.fillRect(5, 9, 18, 10);
    graphics.fillStyle(0xc58a45, 1);
    graphics.fillRect(5, 6, 18, 5);
    graphics.lineStyle(2, 0x4d2f14, 1);
    graphics.strokeRect(5, 6, 18, 13);
    graphics.lineStyle(1, 0xf6d28e, 0.9);
    graphics.lineBetween(14, 6, 14, 19);
    graphics.generateTexture('reward-chest', 28, 22);

    graphics.clear();
    graphics.fillStyle(0x22384d, 1);
    graphics.fillCircle(11, 11, 10);
    graphics.lineStyle(2, 0x9deaff, 1);
    graphics.lineBetween(11, 3, 11, 19);
    graphics.lineBetween(5, 9, 11, 3);
    graphics.lineBetween(17, 9, 11, 19);
    graphics.generateTexture('powerup-frenzy', 22, 22);

    graphics.clear();
    graphics.fillStyle(0x3b2026, 1);
    graphics.fillCircle(11, 11, 10);
    graphics.fillStyle(0xff875f, 1);
    graphics.fillTriangle(10, 3, 17, 10, 12, 10);
    graphics.fillTriangle(8, 10, 14, 10, 6, 19);
    graphics.fillTriangle(10, 12, 16, 12, 9, 19);
    graphics.generateTexture('powerup-overcharge', 22, 22);

    graphics.clear();
    graphics.fillStyle(0x21311f, 1);
    graphics.fillCircle(11, 11, 10);
    graphics.fillStyle(0xd8ff9b, 1);
    graphics.fillCircle(6, 11, 2.5);
    graphics.fillCircle(11, 7, 2.5);
    graphics.fillCircle(11, 15, 2.5);
    graphics.fillCircle(16, 11, 2.5);
    graphics.generateTexture('powerup-volley', 22, 22);

    graphics.clear();
    graphics.fillStyle(0x162637, 1);
    graphics.fillCircle(11, 11, 10);
    graphics.lineStyle(2, 0xaee9ff, 0.95);
    graphics.strokeCircle(11, 11, 7);
    graphics.lineStyle(2, 0x69cfff, 0.95);
    graphics.beginPath();
    graphics.moveTo(11, 4);
    graphics.lineTo(8, 9);
    graphics.lineTo(13, 9);
    graphics.lineTo(9, 18);
    graphics.lineTo(14, 12);
    graphics.lineTo(10, 12);
    graphics.lineTo(11, 4);
    graphics.strokePath();
    graphics.fillStyle(0xd8f5ff, 0.92);
    graphics.fillCircle(11, 11, 2.5);
    graphics.generateTexture('powerup-frost', 22, 22);

    graphics.clear();
    graphics.lineStyle(4, 0x7fdcff, 0.42);
    graphics.strokeCircle(40, 40, 30);
    graphics.lineStyle(2, 0xc7f4ff, 0.8);
    graphics.strokeCircle(40, 40, 20);
    graphics.fillStyle(0x9ae8ff, 0.18);
    graphics.fillCircle(40, 40, 10);
    graphics.generateTexture('slow-burst-ring', 80, 80);

    const createSeededRng = (seed) => {
      let value = (seed + 1) >>> 0;
      return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
      };
    };
    const grassPalette = [0x5c8f45, 0x68994c, 0x74a756, 0x7db05d, 0x557c3f, 0x486d34];
    const drawGrassPatch = (rng) => {
      const width = 24 + Math.floor(rng() * 30);
      const height = 18 + Math.floor(rng() * 24);
      const x = 16 + Math.floor(rng() * (GRASS_TILE_SIZE - width - 32));
      const y = 16 + Math.floor(rng() * (GRASS_TILE_SIZE - height - 32));
      const color = grassPalette[Math.floor(rng() * grassPalette.length)];
      const alpha = 0.12 + rng() * 0.14;

      graphics.fillStyle(color, alpha);
      graphics.fillEllipse(x + width / 2, y + height / 2, width, height);
    };
    const drawGrassBlade = (rng) => {
      const baseX = 12 + Math.floor(rng() * (GRASS_TILE_SIZE - 24));
      const baseY = 18 + Math.floor(rng() * (GRASS_TILE_SIZE - 30));
      const height = 5 + Math.floor(rng() * 10);
      const lean = -3 + Math.floor(rng() * 7);
      const color = grassPalette[Math.floor(rng() * (grassPalette.length - 1))];
      const alpha = 0.28 + rng() * 0.28;

      graphics.lineStyle(1, color, alpha);
      graphics.lineBetween(baseX, baseY + height, baseX + lean, baseY);
    };

    for (let variant = 0; variant < 16; variant += 1) {
      const rng = createSeededRng(variant * 97);

      graphics.clear();
      graphics.fillStyle(0x6b9f51, 1);
      graphics.fillRect(0, 0, GRASS_TILE_SIZE, GRASS_TILE_SIZE);

      for (let patch = 0; patch < 8; patch += 1) {
        drawGrassPatch(rng);
      }

      for (let blade = 0; blade < 72; blade += 1) {
        drawGrassBlade(rng);
      }

      graphics.fillStyle(0x89bc68, 0.05);
      graphics.fillCircle(22 + Math.floor(rng() * 84), 22 + Math.floor(rng() * 84), 10 + Math.floor(rng() * 14));
      graphics.generateTexture(`grass-${variant}`, GRASS_TILE_SIZE, GRASS_TILE_SIZE);
    }

    graphics.destroy();
  }

  playSlowBurstVfx(x, y) {
    const add = this.add;
    const tweens = this.tweens;

    if (!add?.image || !tweens?.add) {
      return;
    }

    const outerRing = add.image(x, y, 'slow-burst-ring').setDepth(5.35).setAlpha(0.9).setScale(0.45);
    const innerRing = add.image(x, y, 'slow-burst-ring');
    innerRing.setDepth?.(5.36);
    innerRing.setTint?.(0xdff8ff);
    innerRing.setAlpha?.(0.7);
    innerRing.setScale?.(0.28);

    tweens.add({
      targets: outerRing,
      alpha: 0,
      scale: 2.2,
      duration: 320,
      ease: 'Cubic.Out',
      onComplete: () => outerRing.destroy?.()
    });
    tweens.add({
      targets: innerRing,
      alpha: 0,
      scale: 1.5,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => innerRing.destroy?.()
    });
  }

  ensureBackgroundTilePool(count) {
    this.backgroundTiles = this.backgroundTiles.filter((tile) => tile?.scene?.sys);

    while (this.backgroundTiles.length < count) {
      const tile = this.add.image(0, 0, 'grass-0');
      tile.setOrigin(0);
      tile.setDepth(-1);
      this.backgroundTiles.push(tile);
    }

    for (let index = count; index < this.backgroundTiles.length; index += 1) {
      this.backgroundTiles[index].setVisible(false);
    }
  }

  syncBackgroundTiles() {
    if (!this.cameras?.main || !this.scale?.width || !this.scale?.height) {
      return;
    }

    const tiles = getVisibleGrassTiles(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      this.scale.width,
      this.scale.height
    );

    this.ensureBackgroundTilePool(tiles.length);

    tiles.forEach((tileData, index) => {
      const tile = this.backgroundTiles[index];
      const textureKey = getGrassTextureKey(tileData.tileX, tileData.tileY);

      if (tile.texture?.key !== textureKey) {
        tile.setTexture(textureKey);
      }

      tile.setPosition(tileData.worldX, tileData.worldY);
      tile.setVisible(true);
    });
  }

  ensureStructureTilePool(count) {
    this.structureTiles = this.structureTiles.filter((tile) => tile?.scene?.sys);

    while (this.structureTiles.length < count) {
      const tile = this.wallGroup.create(0, 0, 'cobble-wall');
      tile.setOrigin(0);
      tile.setDepth(1.5);
      if (tile.body) {
        tile.body.enable = false;
      }
      this.structureTiles.push(tile);
    }

    for (let index = count; index < this.structureTiles.length; index += 1) {
      this.structureTiles[index].setVisible(false);
      if (this.structureTiles[index].body) {
        this.structureTiles[index].body.enable = false;
      }
    }
  }

  syncStructureTiles() {
    if (!this.cameras?.main || !this.scale?.width || !this.scale?.height || !this.physics?.add) {
      return;
    }

    const tiles = getVisibleStructureTiles(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      this.scale.width,
      this.scale.height
    );

    this.ensureStructureTilePool(tiles.length);

    tiles.forEach((tileData, index) => {
      const tile = this.structureTiles[index];

      if (tile.texture?.key !== 'cobble-wall') {
        tile.setTexture?.('cobble-wall');
      }

      tile.setPosition(tileData.worldX, tileData.worldY);
      tile.setVisible(true);
      if (tile.body) {
        tile.body.enable = true;
      }
      tile.refreshBody?.();
    });
  }

  ensurePowerupCompassPool(count) {
    this.powerupCompassIndicators = this.powerupCompassIndicators.filter((indicator) => indicator?.icon?.scene?.sys);

    while (this.powerupCompassIndicators.length < count) {
      const glow = this.add.circle(0, 0, 15, 0x33210f, 0.7);
      const icon = this.add.image(0, 0, 'powerup-frenzy');
      const arrow = this.add.triangle(0, 0, 0, 12, 18, 6, 0, 0, 0xffe8ae, 0.92);
      glow.setDepth(43);
      icon.setDepth(44);
      arrow.setDepth(42.5);
      glow.setScrollFactor(0);
      icon.setScrollFactor(0);
      arrow.setScrollFactor(0);
      icon.setScale(1.05);
      icon.setVisible(false);
      glow.setVisible(false);
      arrow.setVisible(false);
      this.powerupCompassIndicators.push({ arrow, glow, icon });
    }

    for (let index = count; index < this.powerupCompassIndicators.length; index += 1) {
      this.powerupCompassIndicators[index].icon.setVisible(false);
      this.powerupCompassIndicators[index].glow.setVisible(false);
      this.powerupCompassIndicators[index].arrow.setVisible(false);
    }
  }

  syncPowerupCompassIndicators() {
    const activePowerups = (this.pickupManager?.group?.getChildren?.() ?? []).filter(
      (pickup) => pickup?.active && pickup.kind === 'powerup'
    );
    this.ensurePowerupCompassPool(activePowerups.length);
    this.updatePowerupCompassIndicators();
  }

  layoutPowerupCompassIndicators() {
    this.updatePowerupCompassIndicators();
  }

  updatePowerupCompassIndicators() {
    const camera = this.cameras?.main;
    const viewportWidth = this.scale?.width;
    const viewportHeight = this.scale?.height;
    const activePowerups = (this.pickupManager?.group?.getChildren?.() ?? []).filter(
      (pickup) => pickup?.active && pickup.kind === 'powerup'
    );

    this.ensurePowerupCompassPool(activePowerups.length);

    activePowerups.forEach((pickup, index) => {
      const indicator = this.powerupCompassIndicators[index];
      const state = getPowerupCompassState(pickup, camera, viewportWidth, viewportHeight);

      if (!indicator || !state) {
        indicator?.icon?.setVisible(false);
        indicator?.glow?.setVisible(false);
        indicator?.arrow?.setVisible(false);
        return;
      }

      const textureKey = `powerup-${pickup.buffKey}`;
      indicator.icon.setTexture(textureKey);
      indicator.icon.setPosition(state.x, state.y);
      indicator.glow.setPosition(state.x, state.y);
      indicator.arrow.setPosition(state.x + Math.cos(state.angle) * 17, state.y + Math.sin(state.angle) * 17);
      indicator.arrow.setRotation(state.angle + Math.PI / 2);
      indicator.icon.setVisible(true);
      indicator.glow.setVisible(true);
      indicator.arrow.setVisible(true);
    });

    for (let index = activePowerups.length; index < this.powerupCompassIndicators.length; index += 1) {
      this.powerupCompassIndicators[index].icon.setVisible(false);
      this.powerupCompassIndicators[index].glow.setVisible(false);
      this.powerupCompassIndicators[index].arrow.setVisible(false);
    }
  }
}
