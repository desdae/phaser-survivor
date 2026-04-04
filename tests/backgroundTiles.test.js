import { describe, expect, it } from 'vitest';
import {
  GRASS_TILE_OVERSCAN,
  GRASS_TILE_SIZE,
  getGrassTextureKey,
  getVisibleGrassTiles
} from '../src/game/logic/backgroundTiles.js';

describe('getGrassTextureKey', () => {
  it('returns a stable grass variant key for a world tile coordinate', () => {
    expect(getGrassTextureKey(3, -2)).toBe(getGrassTextureKey(3, -2));
    expect(getGrassTextureKey(3, -2)).toMatch(/^grass-(\d|1[0-5])$/);
  });

  it('varies across nearby cells instead of repeating a single tile', () => {
    const keys = new Set([
      getGrassTextureKey(0, 0),
      getGrassTextureKey(1, 0),
      getGrassTextureKey(0, 1),
      getGrassTextureKey(1, 1)
    ]);

    expect(keys.size).toBeGreaterThan(1);
  });
});

describe('getVisibleGrassTiles', () => {
  it('returns a viewport tile grid with overscan in world coordinates', () => {
    const tiles = getVisibleGrassTiles(0, 0, 256, 128);

    expect(tiles).toHaveLength((2 + GRASS_TILE_OVERSCAN * 2) * (1 + GRASS_TILE_OVERSCAN * 2));
    expect(tiles[0]).toEqual({
      tileX: -1,
      tileY: -1,
      worldX: -GRASS_TILE_SIZE,
      worldY: -GRASS_TILE_SIZE
    });
    expect(tiles.at(-1)).toEqual({
      tileX: 2,
      tileY: 1,
      worldX: GRASS_TILE_SIZE * 2,
      worldY: GRASS_TILE_SIZE
    });
  });

  it('handles negative camera scroll correctly', () => {
    const tiles = getVisibleGrassTiles(-64, -32, 128, 128);

    expect(tiles[0].tileX).toBe(-2);
    expect(tiles[0].tileY).toBe(-2);
    expect(tiles.some((tile) => tile.tileX === -1 && tile.tileY === -1)).toBe(true);
  });
});
