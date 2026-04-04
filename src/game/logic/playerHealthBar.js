const PLAYER_HEALTH_BAR = {
  width: 28,
  height: 8,
  fillInset: 2,
  offsetY: 22
};

export function getPlayerHealthBarState(x, y, health, maxHealth) {
  const fillWidth = PLAYER_HEALTH_BAR.width - PLAYER_HEALTH_BAR.fillInset * 2;
  const fillHeight = PLAYER_HEALTH_BAR.height - PLAYER_HEALTH_BAR.fillInset * 2;
  const ratio = maxHealth > 0 ? Math.min(1, Math.max(0, health / maxHealth)) : 0;
  const frameX = Math.round(x - PLAYER_HEALTH_BAR.width / 2);
  const frameY = Math.round(y + PLAYER_HEALTH_BAR.offsetY);

  return {
    frameWidth: PLAYER_HEALTH_BAR.width,
    frameHeight: PLAYER_HEALTH_BAR.height,
    fillWidth: Math.round(fillWidth * ratio),
    fillHeight,
    frameX,
    frameY,
    fillX: frameX + PLAYER_HEALTH_BAR.fillInset,
    fillY: frameY + PLAYER_HEALTH_BAR.fillInset
  };
}
