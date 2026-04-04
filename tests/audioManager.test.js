import { describe, expect, it, vi } from 'vitest';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';
import { AudioManager } from '../src/game/systems/AudioManager.js';

function createFakeAudioContext() {
  const oscillator = {
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine'
  };
  const gainNode = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  };

  return {
    context: {
      createGain: vi.fn(() => gainNode),
      createOscillator: vi.fn(() => oscillator),
      currentTime: 12,
      destination: { key: 'destination' },
      resume: vi.fn(() => Promise.resolve())
    },
    gainNode,
    oscillator
  };
}

describe('AudioManager', () => {
  it('fails safely when audio context creation throws', async () => {
    const manager = new AudioManager(() => {
      throw new Error('blocked');
    });

    await expect(manager.unlock()).resolves.toBeNull();
    expect(() => manager.playEnemyHit()).not.toThrow();
    expect(() => manager.playGameOver()).not.toThrow();
  });

  it('reuses the unlocked audio context for playback and starts/stops oscillators', async () => {
    const { context, gainNode, oscillator } = createFakeAudioContext();
    const manager = new AudioManager(() => context);

    await manager.unlock();
    manager.playEnemyHit();

    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(context.createGain).toHaveBeenCalledTimes(1);
    expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
    expect(gainNode.connect).toHaveBeenCalledWith(context.destination);
    expect(oscillator.start).toHaveBeenCalledWith(context.currentTime);
    expect(oscillator.stop).toHaveBeenCalled();
  });
});

describe('EnemyManager audio integration', () => {
  function createScene() {
    return {
      cameras: {
        main: {
          height: 600,
          scrollX: 0,
          scrollY: 0,
          width: 800
        }
      },
      physics: {
        add: {
          collider: vi.fn(),
          group: () => ({
            children: {
              iterate: vi.fn()
            },
            create: vi.fn((x, y) => ({
              setCircle: vi.fn(),
              setDepth: vi.fn(),
              setScale: vi.fn(),
              setTintFill: vi.fn(),
              x,
              y
            }))
          })
        }
      },
      time: {
        delayedCall: vi.fn()
      }
    };
  }

  it('does not play elite warning audio from the spawn layer', () => {
    const audioManager = {
      playEliteWarning: vi.fn()
    };
    const manager = new EnemyManager(
      createScene(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn() },
      null,
      () => 1,
      null,
      audioManager
    );

    manager.spawnEnemy('basic', { elite: true });

    expect(audioManager.playEliteWarning).not.toHaveBeenCalled();
  });

  it('plays hit audio for non-lethal damage and elite death audio for elite kills', () => {
    const pickupManager = {
      spawnChest: vi.fn(),
      spawnHeart: vi.fn(),
      spawnOrb: vi.fn()
    };
    const audioManager = {
      playEliteDeath: vi.fn(),
      playEnemyDeath: vi.fn(),
      playEnemyHit: vi.fn()
    };
    const manager = new EnemyManager(
      createScene(),
      { sprite: { x: 0, y: 0 } },
      pickupManager,
      null,
      () => 1,
      null,
      audioManager
    );
    const enemy = {
      active: true,
      clearTint: vi.fn(),
      destroy: vi.fn(),
      eliteTint: 0xff00ff,
      health: 10,
      isElite: true,
      setTintFill: vi.fn(),
      x: 10,
      xpValue: 4,
      y: 20
    };

    expect(manager.damageEnemy(enemy, 3)).toBe(false);
    expect(audioManager.playEnemyHit).toHaveBeenCalledTimes(1);

    expect(manager.damageEnemy(enemy, 10)).toBe(true);
    expect(audioManager.playEliteDeath).toHaveBeenCalledTimes(1);
    expect(audioManager.playEnemyDeath).not.toHaveBeenCalled();
  });
});
