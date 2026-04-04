export const GRASS_TILE_SIZE = 128;
export const GRASS_TILE_VARIANT_COUNT = 16;
export const GRASS_TILE_OVERSCAN = 1;

function hashTileCoordinates(tileX, tileY) {
  let hash = Math.imul(tileX ^ 0x9e3779b9, 0x85ebca6b);
  hash ^= Math.imul(tileY ^ 0xc2b2ae35, 0x27d4eb2d);
  hash ^= hash >>> 15;
  return hash >>> 0;
}

export function getGrassTextureKey(tileX, tileY, variantCount = GRASS_TILE_VARIANT_COUNT) {
  return `grass-${hashTileCoordinates(tileX, tileY) % variantCount}`;
}

export function getVisibleGrassTiles(
  scrollX,
  scrollY,
  viewWidth,
  viewHeight,
  tileSize = GRASS_TILE_SIZE,
  overscan = GRASS_TILE_OVERSCAN
) {
  const startTileX = Math.floor(scrollX / tileSize) - overscan;
  const endTileX = Math.floor((scrollX + viewWidth - 1) / tileSize) + overscan;
  const startTileY = Math.floor(scrollY / tileSize) - overscan;
  const endTileY = Math.floor((scrollY + viewHeight - 1) / tileSize) + overscan;
  const tiles = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      tiles.push({
        tileX,
        tileY,
        worldX: tileX * tileSize,
        worldY: tileY * tileSize
      });
    }
  }

  return tiles;
}
