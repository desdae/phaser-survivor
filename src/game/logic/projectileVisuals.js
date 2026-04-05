export function getMagicMissileTextureSpec() {
  return {
    width: 10,
    height: 10,
    glows: [
      {
        color: 0x8f4dff,
        alpha: 0.3,
        x: 5,
        y: 5,
        radius: 4.6
      },
      {
        color: 0xc785ff,
        alpha: 0.42,
        x: 5,
        y: 5,
        radius: 3.4
      }
    ],
    spikes: [
      { color: 0x6f2dff, alpha: 0.88, points: [5, 0.1, 6.2, 3.2, 5.1, 3.3] },
      { color: 0x9f63ff, alpha: 0.82, points: [8.8, 2, 6.5, 4, 6.1, 3] },
      { color: 0x6f2dff, alpha: 0.86, points: [9.7, 5.1, 6.6, 5.6, 6.7, 4.6] },
      { color: 0x9f63ff, alpha: 0.82, points: [8.2, 8.6, 6.2, 6.4, 5.8, 7.1] },
      { color: 0x6f2dff, alpha: 0.84, points: [3.2, 9.5, 4.3, 6.8, 5.1, 7.1] },
      { color: 0xa86aff, alpha: 0.8, points: [0.4, 4.2, 3.6, 4.4, 3.1, 5.5] }
    ],
    core: {
      color: 0xffffff,
      alpha: 0.98,
      x: 5,
      y: 5,
      radius: 2.2
    }
  };
}
