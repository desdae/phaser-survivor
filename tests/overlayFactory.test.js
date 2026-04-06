import { describe, expect, it, vi } from 'vitest';
import {
  createJournalOverlay,
  createHud,
  createPowerupHud,
  createChestOverlay,
  createDamageStatsOverlay,
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
    texture: null,
    width: 0,
    height: 0,
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
    setSize: vi.fn(function setSize(width, height) {
      this.width = width;
      this.height = height;
      return this;
    }),
    setDisplaySize: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setTexture: vi.fn(function setTexture(value) {
      this.texture = value;
      return this;
    }),
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
  const images = [];
  const containers = [];

  return {
    rectangles,
    texts,
    images,
    containers,
    scale: {
      width: 1280,
      height: 720
    },
    add: {
      rectangle: vi.fn((x = 0, y = 0, width = 0, height = 0) => {
        const rectangle = createFakeDisplayObject();
        rectangle.x = x;
        rectangle.y = y;
        rectangle.width = width;
        rectangle.height = height;
        rectangles.push(rectangle);
        return rectangle;
      }),
      text: vi.fn(() => {
        const text = createFakeDisplayObject();
        texts.push(text);
        return text;
      }),
      image: vi.fn(() => {
        const image = createFakeDisplayObject();
        images.push(image);
        return image;
      }),
      container: vi.fn(() => {
        const container = createFakeDisplayObject();
        containers.push(container);
        return container;
      })
    },
    tweens: {
      add: vi.fn()
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

  it('adds a centered bottom xp bar and updates its fill from xp progress', () => {
    const scene = createFakeScene();
    const hud = createHud(scene);

    hud.layout(1280, 720);
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
      eliteWarning: ''
    });

    expect(scene.rectangles).toHaveLength(3);
    expect(scene.rectangles[1].x).toBe(142);
    expect(scene.rectangles[1].y).toBe(636);
    expect(scene.rectangles[2].x).toBe(146);
    expect(scene.rectangles[2].y).toBe(640);
    expect(scene.rectangles[1].setSize).toHaveBeenLastCalledWith(960, 24);
    expect(scene.rectangles[2].setSize).toHaveBeenLastCalledWith(571, 16);
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

describe('createDamageStatsOverlay', () => {
  it('shows a tooltip when hovering a visible learned weapon row', () => {
    const scene = createFakeScene();
    const overlay = createDamageStatsOverlay(scene);

    overlay.layout(1280, 720);
    overlay.toggle();
    overlay.update(
      [
        { key: 'projectile', label: 'Auto Shot', totalDamage: 42, dps: 8.4 },
        { key: 'burstRifle', label: 'Burst Rifle', totalDamage: 21, dps: 4.2 }
      ],
      {
        projectile: {
          title: 'Auto Shot',
          rows: [
            { label: 'Damage', value: '34' },
            { label: 'Cooldown', value: '0.41s' }
          ]
        },
        burstRifle: {
          title: 'Burst Rifle',
          rows: [{ label: 'Damage', value: '17' }]
        }
      }
    );

    const shown = overlay.hoverPointer(980, 74);

    expect(shown).toBe(true);
    expect(overlay.getTooltipState()).toEqual({ visible: true, key: 'projectile' });
    expect(scene.texts.some((text) => text.text === 'Auto Shot')).toBe(true);
    expect(scene.texts.some((text) => text.text === 'Damage 34')).toBe(true);
  });

  it('positions the tooltip locally to the panel container so it stays on screen', () => {
    const scene = createFakeScene();
    const overlay = createDamageStatsOverlay(scene);

    overlay.layout(1280, 720);
    overlay.toggle();
    overlay.update(
      [{ key: 'projectile', label: 'Auto Shot', totalDamage: 42, dps: 8.4 }],
      {
        projectile: {
          title: 'Auto Shot',
          rows: [{ label: 'Damage', value: '34' }]
        }
      }
    );

    overlay.hoverPointer(980, 74);

    expect(scene.rectangles[1].x).toBeLessThan(0);
    expect(scene.texts[9].x).toBeLessThan(0);
  });

  it('hides the tooltip when hovering outside the visible row bounds', () => {
    const scene = createFakeScene();
    const overlay = createDamageStatsOverlay(scene);

    overlay.layout(1280, 720);
    overlay.toggle();
    overlay.update(
      [{ key: 'projectile', label: 'Auto Shot', totalDamage: 42, dps: 8.4 }],
      {
        projectile: {
          title: 'Auto Shot',
          rows: [{ label: 'Damage', value: '34' }]
        }
      }
    );

    overlay.hoverPointer(980, 74);
    const shown = overlay.hoverPointer(30, 30);

    expect(shown).toBe(false);
    expect(overlay.getTooltipState()).toEqual({ visible: false, key: null });
  });
});

describe('createJournalOverlay', () => {
  it('switches tabs and tracks selected row through pointer hit-testing', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'enemies',
      enemies: [
        { key: 'skeleton', label: 'Bone Walker', discovered: true },
        { key: 'tough', label: '???', discovered: false }
      ],
      abilities: [
        { key: 'projectile', label: 'Auto Shot', discovered: true }
      ],
      detail: {
        title: 'Bone Walker',
        rows: [{ label: 'HP', value: '34' }],
        upgradePaths: [],
        description: 'A quick undead swarmer.'
      }
    });

    expect(overlay.getState().layout.titleY).toBeLessThan(overlay.getState().layout.tabY);
    expect(overlay.handlePointer(150, 220)).toEqual({ type: 'select-entry', tab: 'enemies', key: 'skeleton' });
    expect(overlay.handlePointer(560, 128)).toEqual({ type: 'switch-tab', tab: 'abilities' });
  });

  it('returns a close action when clicking the top-right close button', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'enemies',
      enemies: [],
      abilities: [],
      detail: {
        title: '???',
        rows: [],
        upgradePaths: [],
        description: 'An unknown threat.'
      }
    });

    expect(overlay.handlePointer(1160, 80)).toEqual({ type: 'close' });
  });

  it('renders placeholder details for unknown entries and exact rows for discovered entries', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'enemies',
      enemies: [{ key: 'tough', label: '???', discovered: false }],
      abilities: [],
      detail: {
        title: '???',
        rows: [],
        upgradePaths: [],
        description: 'An unknown threat.'
      }
    });

    expect(overlay.getState().detailTitle).toBe('???');
    expect(scene.texts.some((text) => text.text === 'An unknown threat.')).toBe(true);
  });

  it('scrolls overflowing ability entries and exposes a scrollable state', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);
    const abilities = Array.from({ length: 12 }, (_, index) => ({
      key: `ability-${index}`,
      label: `Ability ${index}`,
      discovered: true
    }));

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'abilities',
      enemies: [],
      abilities,
      selectedKey: abilities[0].key,
      detail: {
        title: 'Ability 0',
        rows: [{ label: 'Damage', value: '20' }],
        upgradePaths: Array.from({ length: 5 }, (_, index) => ({
          label: `Upgrade ${index}`,
          value: '+10 power'
        })),
        description: 'A test ability.'
      }
    });

    expect(overlay.getState().listCanScroll).toBe(true);
    expect(overlay.handleWheel(170, 220, 120)).toBe(true);
    expect(overlay.getState().listScrollOffset).toBe(1);
    expect(overlay.handlePointer(150, 220)).toEqual({
      type: 'select-entry',
      tab: 'abilities',
      key: 'ability-1'
    });
  });

  it('scrolls overflowing detail content inside the right panel', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'abilities',
      enemies: [],
      abilities: [{ key: 'projectile', label: 'Auto Shot', discovered: true }],
      selectedKey: 'projectile',
      detail: {
        title: 'Auto Shot',
        rows: [
          { label: 'Damage', value: '18' },
          { label: 'Speed', value: '440' },
          { label: 'Cooldown', value: '520 ms' },
          { label: 'Projectiles', value: '1' }
        ],
        upgradePaths: Array.from({ length: 8 }, (_, index) => ({
          label: `Upgrade ${index}`,
          value: 'Long wrapped bonus description for scrolling verification'
        })),
        description: 'A test ability.'
      }
    });

    expect(overlay.getState().detailCanScroll).toBe(true);
    expect(overlay.handleWheel(910, 470, 120)).toBe(true);
    expect(overlay.getState().detailScrollOffset).toBeGreaterThan(0);
  });

  it('keeps the rendered scrollbar inside the left list panel instead of screen-space drifting', () => {
    const scene = createFakeScene();
    const overlay = createJournalOverlay(scene);
    const abilities = Array.from({ length: 12 }, (_, index) => ({
      key: `ability-${index}`,
      label: `Ability ${index}`,
      discovered: true
    }));

    overlay.layout(1280, 720);
    overlay.show({
      activeTab: 'abilities',
      enemies: [],
      abilities,
      selectedKey: abilities[0].key,
      detail: {
        title: 'Ability 0',
        rows: [{ label: 'Damage', value: '20' }],
        upgradePaths: [],
        description: 'A test ability.'
      }
    });

    const scrollTrack = scene.rectangles.find((rectangle) => rectangle.width === 12 && rectangle.height > 350);
    const scrollThumb = scene.rectangles.find((rectangle) => rectangle.width === 10 && rectangle.height > 30);

    expect(scrollTrack).toBeDefined();
    expect(scrollThumb).toBeDefined();
    expect(scrollTrack.x).toBeLessThanOrEqual(304);
    expect(scrollTrack.x).toBeGreaterThanOrEqual(292);
    expect(scrollThumb.x).toBeGreaterThan(scrollTrack.x);
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
