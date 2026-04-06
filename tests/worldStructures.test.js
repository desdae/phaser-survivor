import { describe, expect, it } from 'vitest';
import {
  STRUCTURE_CHUNK_SIZE,
  WALL_TILE_SIZE,
  getChunkStructureTiles,
  getVisibleStructureTiles
} from '../src/game/logic/worldStructures.js';

describe('getChunkStructureTiles', () => {
  it('returns deterministic structure tiles for the same chunk', () => {
    expect(getChunkStructureTiles(2, -1)).toEqual(getChunkStructureTiles(2, -1));
  });

  it('keeps the origin chunk clear so the player does not spawn inside walls', () => {
    expect(getChunkStructureTiles(0, 0)).toEqual([]);
  });

  it('aligns wall tiles to the world tile grid', () => {
    const tiles = getChunkStructureTiles(1, 1);

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.worldX % WALL_TILE_SIZE === 0)).toBe(true);
    expect(tiles.every((tile) => tile.worldY % WALL_TILE_SIZE === 0)).toBe(true);
  });
});

describe('getVisibleStructureTiles', () => {
  it('returns stable visible wall tiles for a camera view', () => {
    const first = getVisibleStructureTiles(0, 0, 1280, 720);
    const second = getVisibleStructureTiles(0, 0, 1280, 720);

    expect(first).toEqual(second);
  });

  it('includes structures from nearby chunks around the current view', () => {
    const tiles = getVisibleStructureTiles(0, 0, STRUCTURE_CHUNK_SIZE, STRUCTURE_CHUNK_SIZE);

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.some((tile) => tile.tileX >= CHUNK_TILE_START())).toBe(true);
  });
});

function CHUNK_TILE_START() {
  return STRUCTURE_CHUNK_SIZE / WALL_TILE_SIZE;
}
