import { describe, expect, it, vi } from 'vitest';
import { createLevelUpOverlay } from '../src/game/ui/overlayFactory.js';

function createFakeDisplayObject() {
  const handlers = new Map();

  return {
    handlers,
    visible: true,
    text: '',
    style: null,
    setStrokeStyle: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function setVisible(value) {
      this.visible = value;
      return this;
    }),
    setOrigin: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
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

describe('createLevelUpOverlay', () => {
  it('binds click handlers to the visible card backgrounds', () => {
    const scene = createFakeScene();
    const onSelect = vi.fn();
    const overlay = createLevelUpOverlay(scene, onSelect);
    const choices = [
      { key: 'unlockBlade', label: 'Orbiting Blade', description: 'Unlock a circling blade.' },
      { key: 'damage', label: 'Sharpened Shots', description: '+8 projectile damage' },
      { key: 'heal', label: 'Field Medicine', description: 'Restore 30 health' }
    ];

    overlay.show(choices);

    const firstCardBackground = scene.rectangles[2];
    expect(firstCardBackground.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });

    firstCardBackground.handlers.get('pointerdown')();

    expect(onSelect).toHaveBeenCalledWith(choices[0]);
  });
});
