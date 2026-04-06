import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Vector2: class Vector2 {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }

        normalize() {
          const length = Math.hypot(this.x, this.y) || 1;
          this.x /= length;
          this.y /= length;
          return this;
        }
      }
    }
  }
}));

import { Player } from '../src/game/entities/Player.js';

function createSceneStub() {
  return {
    add: {
      rectangle: () => ({
        setDepth() {
          return this;
        },
        setOrigin() {
          return this;
        },
        setPosition() {
          return this;
        },
        setSize() {
          return this;
        },
        setStrokeStyle() {
          return this;
        }
      })
    },
    physics: {
      add: {
        image: (x, y) => ({
          x,
          y,
          setCircle() {
            return this;
          },
          setDepth() {
            return this;
          },
          setVelocity() {
            return this;
          }
        })
      }
    }
  };
}

describe('Player', () => {
  it('applies learned damage mitigation multiplicatively when taking hits', () => {
    const player = new Player(createSceneStub(), 0, 0);
    player.stats.damageTakenMultiplier = 0.81;

    const died = player.takeDamage(10);

    expect(died).toBe(false);
    expect(player.stats.health).toBeCloseTo(91.9, 5);
  });
});
