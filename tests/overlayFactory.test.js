import { describe, expect, it, vi } from 'vitest';
import {
  createHud,
  createPowerupHud,
  createChestOverlay,
  createFpsCounter,
  createGameOverOverlay,
  createLevelUpOverlay
} from '../src/game/ui/overlayFactory.js';

function createFakeDisplayObject() {
  const handlers = new Map();

  return {
    handlers,
    visible: true,
    text: '',
    style: null,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    setStrokeStyle: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function setVisible(value) {
      this.visible = value;
      return this;
    }),
    setOrigin: vi.fn().mockReturnThis(),
    setPosition: vi.fn(function setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }),
    setScale: vi.fn(function setScale(x, y = x) {
      this.scaleX = x;
      this.scaleY = y;
      return this;
    }),
    setSize: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setText: vi.fn(function setText(value) {
      this.text = value;
      return this;
    }),
    setStyle: vi.fn(function setStyle(value) {
      this.style = value;
      return this;
    }),
    on: vi.fn(function on(eventName, handler) {
      handlers.set(eventName, handler);
      return this;
    })
  };
}

function createFakeScene() {
  const rectangles = [];
  const texts = [];
  const containers = [];

  return {
    rectangles,
    texts,
    containers,
    add: {
      rectangle: vi.fn(() => {
        const rectangle = createFakeDisplayObject();
        rectangles.push(rectangle);
        return rectangle;
      }),
      text: vi.fn(() => {
        const text = createFakeDisplayObject();
        texts.push(text);
        return text;
      }),
      container: vi.fn(() => {
        const container = createFakeDisplayObject();
        containers.push(container);
        return container;
      })
    }
  };
}

describe('createHud', () => {
  it('shows elite warning text when eliteWarning is provided', () => {
    const scene = createFakeScene();
    const hud = createHud(scene);

    hud.update({
      health: 88,
      maxHealth: 100,
      level: 5,
      xp: 12,
      xpToNext: 20,
      timeMs: 61000,
      enemyCount: 14,
      projectileCount: 2,
      bladeCount: 1,
      activeWeapons: 3,
      eliteWarning: 'Elite wave incoming'
    });

    expect(scene.texts.some((text) => text.text.includes('Elite wave incoming'))).toBe(true);
  });
});

describe('createFpsCounter', () => {
  it('pins a lightweight fps label to the top-right corner and updates the shown value', () => {
    const scene = createFakeScene();
    const fpsCounter = createFpsCounter(scene);

    fpsCounter.layout(1280);
    fpsCounter.update(58);

    expect(scene.texts.at(-1)?.x).toBe(1262);
    expect(scene.texts.at(-1)?.y).toBe(18);
    expect(scene.texts.at(-1)?.text).toBe('FPS 58');
  });
});

describe('createPowerupHud', () => {
  it('shows formatted active buff rows and hides empty rows', () => {
    const scene = createFakeScene();
    const powerupHud = createPowerupHud(scene);

    powerupHud.update([
      { buffKey: 'frenzy', label: 'Frenzy', stacks: 2, secondsLeft: 18 },
      { buffKey: 'volley', label: 'Volley', stacks: 1, secondsLeft: 9 }
    ]);

    expect(scene.containers.at(-1)?.visible).toBe(true);
    expect(scene.texts.some((text) => text.text === 'Frenzy x2 18s')).toBe(true);
    expect(scene.texts.some((text) => text.text === 'Volley x1 9s')).toBe(true);
  });

  it('hides the panel when there are no active buffs', () => {
    const scene = createFakeScene();
    const powerupHud = createPowerupHud(scene);

    powerupHud.update([]);

    expect(scene.containers.at(-1)?.visible).toBe(false);
  });
});

describe('createLevelUpOverlay', () => {
  it('selects a choice when a pointer hits a visible card region', () => {
    const scene = createFakeScene();
    const onSelect = vi.fn();
    const overlay = createLevelUpOverlay(scene, onSelect);
    const choices = [
      { key: 'unlockBlade', label: 'Orbiting Blade', description: 'Unlock a circling blade.' },
      { key: 'damage', label: 'Sharpened Shots', description: '+8 projectile damage' },
      { key: 'heal', label: 'Field Medicine', description: 'Restore 30 health' }
    ];

    overlay.show(choices);
    overlay.layout(1280, 720);

    const selected = overlay.choosePointer(340, 410);

    expect(selected).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(choices[0]);
  });

  it('ignores pointer clicks outside of the cards', () => {
    const scene = createFakeScene();
    const onSelect = vi.fn();
    const overlay = createLevelUpOverlay(scene, onSelect);
    const choices = [
      { key: 'unlockBlade', label: 'Orbiting Blade', description: 'Unlock a circling blade.' },
      { key: 'damage', label: 'Sharpened Shots', description: '+8 projectile damage' },
      { key: 'heal', label: 'Field Medicine', description: 'Restore 30 health' }
    ];

    overlay.show(choices);
    overlay.layout(1280, 720);

    const selected = overlay.choosePointer(40, 40);

    expect(selected).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('createChestOverlay', () => {
  it('selects a reward when a pointer hits a visible card region', () => {
    const scene = createFakeScene();
    const onSelect = vi.fn();
    const overlay = createChestOverlay(scene, onSelect);
    const rewards = [
      { key: 'arsenalDraft', label: 'Arsenal Draft', description: 'Unlock a missing weapon.' },
      { key: 'relicDamage', label: 'Relic: Impact', description: '+14 projectile damage' },
      { key: 'soulMagnet', label: 'Soul Magnet', description: 'Vacuum nearby pickups.' }
    ];

    overlay.show(rewards);
    overlay.layout(1280, 720);

    const selected = overlay.choosePointer(340, 410);

    expect(selected).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(rewards[0]);
  });
});

describe('createGameOverOverlay', () => {
  it('restarts when a pointer hits the restart button region', () => {
    const scene = createFakeScene();
    const onRestart = vi.fn();
    const overlay = createGameOverOverlay(scene, onRestart);

    overlay.show({ timeMs: 64000, level: 7 });
    overlay.layout(1280, 720);

    const selected = overlay.choosePointer(640, 452);

    expect(selected).toBe(true);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('ignores pointer clicks outside of the restart button region', () => {
    const scene = createFakeScene();
    const onRestart = vi.fn();
    const overlay = createGameOverOverlay(scene, onRestart);

    overlay.show({ timeMs: 64000, level: 7 });
    overlay.layout(1280, 720);

    const selected = overlay.choosePointer(40, 40);

    expect(selected).toBe(false);
    expect(onRestart).not.toHaveBeenCalled();
  });
});
