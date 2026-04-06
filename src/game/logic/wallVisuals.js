export function getCobbleWallTextureSpec() {
  return {
    background: {
      alpha: 1,
      color: 0x4e4037,
      height: 32,
      width: 32,
      x: 0,
      y: 0
    },
    highlightRects: [
      { alpha: 0.92, color: 0x6b5a4f, height: 10, width: 12, x: 1, y: 1 },
      { alpha: 0.88, color: 0x6b5a4f, height: 10, width: 11, x: 18, y: 1 },
      { alpha: 0.9, color: 0x6b5a4f, height: 10, width: 14, x: 1, y: 17 },
      { alpha: 0.84, color: 0x6b5a4f, height: 10, width: 9, x: 20, y: 17 }
    ],
    shadowRects: [
      { alpha: 0.48, color: 0x8d7869, height: 2, width: 9, x: 2, y: 3 },
      { alpha: 0.42, color: 0x8d7869, height: 2, width: 8, x: 19, y: 4 },
      { alpha: 0.42, color: 0x8d7869, height: 2, width: 8, x: 3, y: 19 },
      { alpha: 0.38, color: 0x8d7869, height: 2, width: 6, x: 21, y: 20 }
    ],
    innerStroke: {
      alpha: 0.18,
      color: 0xaa987c,
      height: 28,
      lineWidth: 1,
      width: 28,
      x: 2,
      y: 2
    },
    outerStroke: {
      alpha: 0.88,
      color: 0x241a15,
      height: 32,
      lineWidth: 2,
      width: 32,
      x: 0,
      y: 0
    }
  };
}
