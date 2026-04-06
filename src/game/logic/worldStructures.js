export const WALL_TILE_SIZE = 32;
export const STRUCTURE_CHUNK_SIZE = 768;
export const STRUCTURE_CHUNK_OVERSCAN = 1;

const CHUNK_TILE_SIZE = STRUCTURE_CHUNK_SIZE / WALL_TILE_SIZE;
const CHUNK_MARGIN_TILES = 3;
const STRUCTURE_TEMPLATES = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2]
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [1, 1],
    [1, 2]
  ]
];

function hashCoordinates(x, y) {
  let hash = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b);
  hash ^= Math.imul(y ^ 0xc2b2ae35, 0x27d4eb2d);
  hash ^= hash >>> 15;
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function transformTemplate(template, rotation, mirrorX) {
  return template.map(([x, y]) => {
    let transformedX = x;
    let transformedY = y;

    if (mirrorX) {
      transformedX = -transformedX;
    }

    for (let step = 0; step < rotation; step += 1) {
      const nextX = -transformedY;
      const nextY = transformedX;
      transformedX = nextX;
      transformedY = nextY;
    }

    return [transformedX, transformedY];
  });
}

function normalizeTemplate(template) {
  const minX = Math.min(...template.map(([x]) => x));
  const minY = Math.min(...template.map(([, y]) => y));

  return template.map(([x, y]) => [x - minX, y - minY]);
}

function getChunkStructureCount(chunkX, chunkY) {
  if (chunkX === 0 && chunkY === 0) {
    return 0;
  }

  const hash = hashCoordinates(chunkX, chunkY) % 100;

  if (hash < 40) {
    return 1;
  }

  if (hash < 52) {
    return 2;
  }

  return 0;
}

export function getChunkStructureTiles(chunkX, chunkY) {
  const structureCount = getChunkStructureCount(chunkX, chunkY);

  if (structureCount === 0) {
    return [];
  }

  const rng = createSeededRandom(hashCoordinates(chunkX, chunkY));
  const occupied = new Set();
  const tiles = [];
  const chunkBaseTileX = chunkX * CHUNK_TILE_SIZE;
  const chunkBaseTileY = chunkY * CHUNK_TILE_SIZE;

  for (let structureIndex = 0; structureIndex < structureCount; structureIndex += 1) {
    const template =
      STRUCTURE_TEMPLATES[Math.floor(rng() * STRUCTURE_TEMPLATES.length)] ?? STRUCTURE_TEMPLATES[0];
    const normalizedTemplate = normalizeTemplate(
      transformTemplate(template, Math.floor(rng() * 4), rng() > 0.5)
    );
    const maxLocalX = Math.max(...normalizedTemplate.map(([x]) => x));
    const maxLocalY = Math.max(...normalizedTemplate.map(([, y]) => y));
    const anchorTileX =
      CHUNK_MARGIN_TILES +
      Math.floor(rng() * Math.max(1, CHUNK_TILE_SIZE - maxLocalX - CHUNK_MARGIN_TILES * 2));
    const anchorTileY =
      CHUNK_MARGIN_TILES +
      Math.floor(rng() * Math.max(1, CHUNK_TILE_SIZE - maxLocalY - CHUNK_MARGIN_TILES * 2));

    normalizedTemplate.forEach(([offsetX, offsetY]) => {
      const tileX = chunkBaseTileX + anchorTileX + offsetX;
      const tileY = chunkBaseTileY + anchorTileY + offsetY;
      const key = `${tileX},${tileY}`;

      if (occupied.has(key)) {
        return;
      }

      occupied.add(key);
      tiles.push({
        tileX,
        tileY,
        worldX: tileX * WALL_TILE_SIZE,
        worldY: tileY * WALL_TILE_SIZE
      });
    });
  }

  return tiles;
}

export function getVisibleStructureTiles(
  scrollX,
  scrollY,
  viewWidth,
  viewHeight,
  chunkSize = STRUCTURE_CHUNK_SIZE,
  overscan = STRUCTURE_CHUNK_OVERSCAN
) {
  const startChunkX = Math.floor(scrollX / chunkSize) - overscan;
  const endChunkX = Math.floor((scrollX + viewWidth - 1) / chunkSize) + overscan;
  const startChunkY = Math.floor(scrollY / chunkSize) - overscan;
  const endChunkY = Math.floor((scrollY + viewHeight - 1) / chunkSize) + overscan;
  const tiles = [];

  for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY += 1) {
    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX += 1) {
      tiles.push(...getChunkStructureTiles(chunkX, chunkY));
    }
  }

  return tiles;
}
