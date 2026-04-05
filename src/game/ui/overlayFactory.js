import { getChoiceByIndex } from '../logic/upgradeSelection.js';
export { createJournalOverlay } from './JournalOverlay.js';

function createButtonCard(scene, onClick) {
  const background = scene.add
    .rectangle(0, 0, 280, 170, 0x163042, 0.96)
    .setStrokeStyle(2, 0x89c7ff, 0.65);
  const badge = scene.add.text(92, -58, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '13px',
    color: '#0d1721',
    fontStyle: 'bold',
    backgroundColor: '#89c7ff',
    padding: { left: 8, right: 8, top: 2, bottom: 2 }
  });
  const title = scene.add.text(-118, -52, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px',
    color: '#f4f8ff',
    fontStyle: 'bold',
    wordWrap: { width: 220 }
  });
  const description = scene.add.text(-118, -8, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#b5d5f3',
    wordWrap: { width: 220 }
  });
  const hint = scene.add.text(-118, 56, 'Choose upgrade', {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#ffd17a'
  });
  const card = scene.add.container(0, 0, [background, badge, title, description, hint]);

  card.setSize(280, 170);
  card.choice = null;
  card.background = background;
  card.badge = badge;
  card.title = title;
  card.description = description;
  card.hint = hint;

  return card;
}

function chooseCardByIndex(cards, index, onSelect) {
  const choice = getChoiceByIndex(cards.map((card) => card.choice).filter(Boolean), index);

  if (choice) {
    onSelect(choice);
  }
}

function chooseCardByPointer(cards, pointerX, pointerY, onSelect) {
  for (const card of cards) {
    if (!card.visible || !card.choice) {
      continue;
    }

    const width = 280 * card.scaleX;
    const height = 170 * card.scaleY;
    const withinX = pointerX >= card.x - width / 2 && pointerX <= card.x + width / 2;
    const withinY = pointerY >= card.y - height / 2 && pointerY <= card.y + height / 2;

    if (!withinX || !withinY) {
      continue;
    }

    card.background.setFillStyle(card.hoverFill ?? 0x1f4561, 1);
    onSelect(card.choice);
    return true;
  }

  return false;
}

export function formatTime(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function createHud(scene) {
  const panel = scene.add.rectangle(0, 0, 340, 164, 0x08121c, 0.75).setOrigin(0);
  panel.setStrokeStyle(2, 0x4da2ff, 0.35);
  const xpBarFrame = scene.add.rectangle(0, 0, 0, 24, 0x08121c, 0.88).setOrigin(0);
  xpBarFrame.setStrokeStyle(2, 0x4da2ff, 0.45);
  const xpBarFill = scene.add.rectangle(0, 0, 0, 16, 0x6be39a, 0.95).setOrigin(0);
  const hpText = scene.add.text(18, 16, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '20px',
    color: '#f4f8ff'
  });
  const levelText = scene.add.text(18, 48, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#c9e5ff'
  });
  const xpText = scene.add.text(18, 76, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#a9f5c2'
  });
  const timeText = scene.add.text(18, 104, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#ffd17a'
  });
  const eliteWarningText = scene.add.text(18, 130, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#f4bf63',
    fontStyle: 'bold'
  });
  const container = scene.add.container(18, 18, [
    panel,
    xpBarFrame,
    xpBarFill,
    hpText,
    levelText,
    xpText,
    timeText,
    eliteWarningText
  ]);

  container.setDepth(40);
  container.setScrollFactor(0);

  const MAX_XP_BAR_WIDTH = 960;
  const MIN_XP_BAR_WIDTH = 360;
  const XP_BAR_MARGIN = 42;
  const XP_BAR_HEIGHT = 24;
  const XP_BAR_INSET = 4;
  let currentXpBarWidth = Math.max(0, MAX_XP_BAR_WIDTH - XP_BAR_INSET * 2);

  return {
    layout(width = 1280, height = 720) {
      container.setPosition(18, 18);

      const barWidth = Math.max(MIN_XP_BAR_WIDTH, Math.min(MAX_XP_BAR_WIDTH, width * 0.75));
      const barX = Math.round((width - barWidth) / 2) - 18;
      const barY = height - XP_BAR_MARGIN - XP_BAR_HEIGHT - 18;
      currentXpBarWidth = Math.max(0, barWidth - XP_BAR_INSET * 2);

      xpBarFrame.setPosition(barX, barY);
      xpBarFrame.setSize(barWidth, XP_BAR_HEIGHT);
      xpBarFill.setPosition(barX + XP_BAR_INSET, barY + XP_BAR_INSET);
      xpBarFill.setSize(currentXpBarWidth, XP_BAR_HEIGHT - XP_BAR_INSET * 2);
    },
    update({
      health,
      maxHealth,
      level,
      xp,
      xpToNext,
      timeMs,
      enemyCount,
      projectileCount,
      bladeCount,
      activeWeapons,
      eliteWarning
    }) {
      const xpRatio = xpToNext > 0 ? Math.min(1, Math.max(0, xp / xpToNext)) : 0;
      const fillWidth = Math.round(currentXpBarWidth * xpRatio);

      hpText.setText(`HP ${Math.ceil(health)} / ${maxHealth}`);
      levelText.setText(`Level ${level}   Threats ${enemyCount}`);
      xpText.setText(`XP ${xp} / ${xpToNext}   Shots ${projectileCount}   Blades ${bladeCount}`);
      timeText.setText(`Time ${formatTime(timeMs)}   Arsenal ${activeWeapons}`);
      eliteWarningText.setText(eliteWarning ?? '');
      xpBarFill.setSize(fillWidth, XP_BAR_HEIGHT - XP_BAR_INSET * 2);
    }
  };
}

export function createFpsCounter(scene) {
  const text = scene.add.text(0, 0, 'FPS 0', {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#b7d7f4'
  });

  text.setDepth(53);
  text.setScrollFactor(0);

  let shownLabel = 'FPS 0';

  return {
    layout(width) {
      text.setPosition(width - 18, 18);
      text.setOrigin(1, 0);
    },
    update(fps) {
      const nextLabel = `FPS ${Math.max(0, Math.round(fps ?? 0))}`;

      if (nextLabel === shownLabel) {
        return;
      }

      shownLabel = nextLabel;
      text.setText(nextLabel);
    }
  };
}

export function createPowerupHud(scene) {
  const panel = scene.add.rectangle(0, 0, 224, 112, 0x08121c, 0.82).setOrigin(0);
  panel.setStrokeStyle(2, 0xffd17a, 0.28);
  const title = scene.add.text(14, 10, 'Powerups', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#ffe9b8',
    fontStyle: 'bold'
  });
  const rows = Array.from({ length: 3 }, (_, index) =>
    scene.add.text(14, 34 + index * 24, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#f4f8ff'
    })
  );
  const container = scene.add.container(0, 0, [panel, title, ...rows]);

  container.setDepth(41);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    layout(width) {
      container.setPosition(width - 242, 72);
    },
    update(summaryRows = []) {
      const activeRows = summaryRows.slice(0, rows.length);

      rows.forEach((rowText, index) => {
        const row = activeRows[index];

        if (!row) {
          rowText.setText('');
          return;
        }

        rowText.setText(`${row.label} x${row.stacks} ${row.secondsLeft}s`);
      });

      container.setVisible(activeRows.length > 0);
    }
  };
}

function formatDamageNumber(value) {
  return Math.round(value).toString();
}

function formatDpsNumber(value) {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

export function createDamageStatsOverlay(scene) {
  const panel = scene.add.rectangle(0, 0, 344, 254, 0x08121c, 0.9).setOrigin(0);
  panel.setStrokeStyle(2, 0x8bc7ff, 0.35);
  const title = scene.add.text(18, 16, 'Damage Stats', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  const hint = scene.add.text(18, 220, 'Tab to toggle', {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#ffd17a'
  });
  const rows = Array.from({ length: 6 }, (_, index) =>
    scene.add.text(18, 52 + index * 26, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#cde4f8'
    })
  );
  const tooltipPanel = scene.add.rectangle(0, 0, 212, 36, 0x08121c, 0.96).setOrigin(0);
  tooltipPanel.setStrokeStyle(2, 0x8bc7ff, 0.45);
  const tooltipTitle = scene.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  const tooltipRows = Array.from({ length: 6 }, () =>
    scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#cde4f8'
    })
  );
  const container = scene.add.container(0, 0, [panel, title, ...rows, hint, tooltipPanel, tooltipTitle, ...tooltipRows]);

  container.setDepth(52);
  container.setScrollFactor(0);
  container.setVisible(false);

  let rowBounds = [];
  let tooltipMap = {};
  let tooltipState = { visible: false, key: null };

  tooltipPanel.setVisible(false);
  tooltipTitle.setVisible(false);
  tooltipRows.forEach((rowText) => rowText.setVisible(false));

  function hideTooltip() {
    tooltipState = { visible: false, key: null };
    tooltipPanel.setVisible(false);
    tooltipTitle.setVisible(false);
    tooltipRows.forEach((rowText) => {
      rowText.setText('');
      rowText.setVisible(false);
    });
  }

  function showTooltip(bounds, payload) {
    const visibleRows = payload.rows.slice(0, tooltipRows.length);
    const tooltipHeight = 38 + visibleRows.length * 20 + 12;
    const maxY = Math.max(12, (scene.scale?.height ?? 720) - tooltipHeight - 12);
    const screenX = Math.max(12, bounds.x - 226);
    const screenY = Math.max(12, Math.min(bounds.y - 10, maxY));
    const localX = screenX - container.x;
    const localY = screenY - container.y;

    tooltipPanel.setPosition(localX, localY);
    tooltipPanel.setSize(212, tooltipHeight);
    tooltipTitle.setPosition(localX + 14, localY + 12);
    tooltipTitle.setText(payload.title);
    tooltipTitle.setVisible(true);

    tooltipRows.forEach((rowText, index) => {
      const row = visibleRows[index];

      if (!row) {
        rowText.setText('');
        rowText.setVisible(false);
        return;
      }

      rowText.setPosition(localX + 14, localY + 40 + index * 20);
      rowText.setText(`${row.label} ${row.value}`);
      rowText.setVisible(true);
    });

    tooltipPanel.setVisible(true);
    tooltipState = { visible: true, key: payload.key ?? null };
  }

  return {
    hide() {
      container.setVisible(false);
      hideTooltip();
    },
    isVisible() {
      return container.visible;
    },
    layout(width) {
      container.setPosition(width - 362, 18);
    },
    toggle() {
      container.setVisible(!container.visible);

      if (!container.visible) {
        hideTooltip();
      }
    },
    update(statRows, nextTooltipMap = {}) {
      tooltipMap = nextTooltipMap;
      rowBounds = [];

      rows.forEach((rowText, index) => {
        const row = statRows[index];

        if (!row) {
          rowText.setText('');
          return;
        }

        rowText.setText(
          `${row.label.padEnd(14, ' ')} ${formatDamageNumber(row.totalDamage)} dmg   ${formatDpsNumber(row.dps)} dps`
        );
        rowBounds.push({
          key: row.key,
          x: container.x + 18,
          y: container.y + 52 + index * 26,
          width: 300,
          height: 22
        });
      });
      hideTooltip();
    },
    hoverPointer(pointerX, pointerY) {
      if (!container.visible) {
        hideTooltip();
        return false;
      }

      const hovered = rowBounds.find(
        (bounds) =>
          pointerX >= bounds.x &&
          pointerX <= bounds.x + bounds.width &&
          pointerY >= bounds.y &&
          pointerY <= bounds.y + bounds.height
      );
      const payload = hovered ? tooltipMap[hovered.key] : null;

      if (!hovered || !payload || payload.rows.length === 0) {
        hideTooltip();
        return false;
      }

      showTooltip(hovered, {
        ...payload,
        key: hovered.key
      });
      return true;
    },
    getTooltipState() {
      return tooltipState;
    }
  };
}

function createJournalOverlayLegacy(scene) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, 0x02060a, 0.86).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 1120, 620, 0x08121c, 0.98).setOrigin(0.5);
  panel.setStrokeStyle(2, 0x6ab7ff, 0.55);
  const title = scene.add.text(0, 0, 'Journal', {
    fontFamily: 'Trebuchet MS',
    fontSize: '34px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  title.setOrigin(0.5);
  const closeButton = scene.add.text(0, 0, '×', {
    fontFamily: 'Trebuchet MS',
    fontSize: '34px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  closeButton.setOrigin(0.5);
  const enemyTab = scene.add.text(0, 0, 'Enemies', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  enemyTab.setOrigin(0.5);
  const abilitiesTab = scene.add.text(0, 0, 'Abilities', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#cde4f8',
    fontStyle: 'bold'
  });
  abilitiesTab.setOrigin(0.5);
  const leftPanel = scene.add.rectangle(0, 0, 300, 500, 0x0d1b29, 0.92).setOrigin(0, 0);
  leftPanel.setStrokeStyle(1, 0x315879, 0.75);
  const rightPanel = scene.add.rectangle(0, 0, 720, 500, 0x0d1b29, 0.92).setOrigin(0, 0);
  rightPanel.setStrokeStyle(1, 0x315879, 0.75);
  const detailTitle = scene.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '28px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  const detailDescription = scene.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#cde4f8',
    wordWrap: { width: 620 }
  });
  const detailRows = Array.from({ length: 8 }, () =>
    scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#dff1ff'
    })
  );
  const upgradeHeader = scene.add.text(0, 0, 'Upgrade Paths', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#ffd17a',
    fontStyle: 'bold'
  });
  const upgradeRows = Array.from({ length: 8 }, () =>
    scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#ffdca0'
    })
  );
  const listRows = Array.from({ length: 12 }, () =>
    scene.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#d6e7f7'
    })
  );

  const container = scene.add.container(0, 0, [
    backdrop,
    panel,
    title,
    closeButton,
    enemyTab,
    abilitiesTab,
    leftPanel,
    rightPanel,
    detailTitle,
    detailDescription,
    ...detailRows,
    upgradeHeader,
    ...upgradeRows,
    ...listRows
  ]);

  container.setDepth(68);
  container.setScrollFactor(0);
  container.setVisible(false);

  let activeTab = 'enemies';
  let tabBounds = [];
  let closeBounds = null;
  let rowBounds = [];
  let currentState = {
    detailTitle: '',
    activeTab: 'enemies'
  };
  let layoutState = {
    width: 1280,
    height: 720,
    panelLeft: 80,
    panelTop: 50
  };

  function applyTabStyles() {
    enemyTab.setStyle({
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: activeTab === 'enemies' ? '#f4f8ff' : '#89a9c7',
      fontStyle: 'bold'
    });
    abilitiesTab.setStyle({
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: activeTab === 'abilities' ? '#f4f8ff' : '#89a9c7',
      fontStyle: 'bold'
    });
  }

  function updateRows(payload) {
    const entries = activeTab === 'enemies' ? payload.enemies : payload.abilities;
    rowBounds = [];

    listRows.forEach((rowText, index) => {
      const entry = entries[index];

      if (!entry) {
        rowText.setText('');
        return;
      }

      const rowX = layoutState.panelLeft + 24;
        const rowY = layoutState.panelTop + 134 + index * 34;
      rowText.setPosition(rowX, rowY);
      rowText.setText(entry.label);
      rowBounds.push({
        key: entry.key,
        tab: activeTab,
        x: rowX,
        y: rowY,
        width: 240,
        height: 24
      });
    });
  }

  function updateDetail(payload) {
    const detail = payload.detail ?? { title: '', rows: [], description: '', upgradePaths: [] };
    currentState = {
      detailTitle: detail.title,
      activeTab
    };

    detailTitle.setText(detail.title ?? '');
    detailDescription.setText(detail.description ?? '');
    detailRows.forEach((rowText, index) => {
      const row = detail.rows?.[index];
      rowText.setText(row ? `${row.label} ${row.value}` : '');
    });
    upgradeHeader.setVisible((detail.upgradePaths?.length ?? 0) > 0);
    upgradeRows.forEach((rowText, index) => {
      const row = detail.upgradePaths?.[index];
      rowText.setText(row ? `${row.label} ${row.value}` : '');
    });
  }

  function applyPayload(payload) {
    activeTab = payload.activeTab ?? activeTab;
    applyTabStyles();
    updateRows(payload);
    updateDetail(payload);
  }

  return {
    hide() {
      container.setVisible(false);
    },
    isVisible() {
      return container.visible;
    },
    layout(width, height) {
      layoutState = {
        width,
        height,
        panelLeft: Math.round((width - 1120) / 2),
        panelTop: Math.round((height - 620) / 2)
      };

      backdrop.setSize(width, height);
      panel.setPosition(width / 2, height / 2);
      title.setPosition(width / 2, layoutState.panelTop + 40);
      closeButton.setPosition(layoutState.panelLeft + 1080, layoutState.panelTop + 40);
      enemyTab.setPosition(layoutState.panelLeft + 355, layoutState.panelTop + 86);
      abilitiesTab.setPosition(layoutState.panelLeft + 515, layoutState.panelTop + 86);
      leftPanel.setPosition(layoutState.panelLeft + 20, layoutState.panelTop + 116);
      rightPanel.setPosition(layoutState.panelLeft + 360, layoutState.panelTop + 116);
      detailTitle.setPosition(layoutState.panelLeft + 390, layoutState.panelTop + 146);
      detailDescription.setPosition(layoutState.panelLeft + 390, layoutState.panelTop + 182);
      detailRows.forEach((rowText, index) => {
        rowText.setPosition(layoutState.panelLeft + 390, layoutState.panelTop + 240 + index * 28);
      });
      upgradeHeader.setPosition(layoutState.panelLeft + 390, layoutState.panelTop + 460);
      upgradeRows.forEach((rowText, index) => {
        rowText.setPosition(layoutState.panelLeft + 390, layoutState.panelTop + 492 + index * 22);
      });

      tabBounds = [
        { tab: 'enemies', x: layoutState.panelLeft + 270, y: layoutState.panelTop + 62, width: 170, height: 48 },
        { tab: 'abilities', x: layoutState.panelLeft + 430, y: layoutState.panelTop + 62, width: 180, height: 48 }
      ];
      closeBounds = {
        x: layoutState.panelLeft + 1056,
        y: layoutState.panelTop + 16,
        width: 48,
        height: 48
      };
    },
    show(payload) {
      container.setVisible(true);
      applyPayload(payload);
    },
    update(payload) {
      applyPayload(payload);
    },
    handlePointer(pointerX, pointerY) {
      if (!container.visible) {
        return null;
      }

      const tabHit = tabBounds.find(
        (bounds) =>
          pointerX >= bounds.x &&
          pointerX <= bounds.x + bounds.width &&
          pointerY >= bounds.y &&
          pointerY <= bounds.y + bounds.height
      );

      if (tabHit) {
        return { type: 'switch-tab', tab: tabHit.tab };
      }

      if (
        closeBounds &&
        pointerX >= closeBounds.x &&
        pointerX <= closeBounds.x + closeBounds.width &&
        pointerY >= closeBounds.y &&
        pointerY <= closeBounds.y + closeBounds.height
      ) {
        return { type: 'close' };
      }

      const rowHit = rowBounds.find(
        (bounds) =>
          pointerX >= bounds.x &&
          pointerX <= bounds.x + bounds.width &&
          pointerY >= bounds.y &&
          pointerY <= bounds.y + bounds.height
      );

      if (rowHit) {
        return { type: 'select-entry', tab: rowHit.tab, key: rowHit.key };
      }

      return null;
    },
    getState() {
      return currentState;
    }
  };
}

export function createLevelUpOverlay(scene, onSelect) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, 0x02060a, 0.76).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 940, 420, 0x0b1926, 0.96).setStrokeStyle(2, 0x4da2ff, 0.5);
  const title = scene.add.text(0, -150, 'Level Up', {
    fontFamily: 'Trebuchet MS',
    fontSize: '40px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  const subtitle = scene.add.text(0, -104, 'Choose one upgrade and get back into the swarm.', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#bad7ef'
  });
  const cards = [createButtonCard(scene, onSelect), createButtonCard(scene, onSelect), createButtonCard(scene, onSelect)];
  const container = scene.add.container(0, 0, [backdrop, panel, title, subtitle, ...cards]);

  title.setOrigin(0.5);
  subtitle.setOrigin(0.5);
  container.setDepth(60);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    hide() {
      container.setVisible(false);
    },
    layout(width, height) {
      backdrop.setSize(width, height);
      panel.setPosition(width / 2, height / 2);
      title.setPosition(width / 2, height / 2 - 150);
      subtitle.setPosition(width / 2, height / 2 - 104);

      const compact = width < 1024;
      cards.forEach((card, index) => {
        const x = compact ? width / 2 : width / 2 - 300 + index * 300;
        const y = compact ? height / 2 - 5 + index * 115 : height / 2 + 50;
        card.setPosition(x, y);
        card.setScale(compact ? 0.82 : 1);
      });
    },
    show(choices) {
      cards.forEach((card, index) => {
        const choice = getChoiceByIndex(choices, index);

        if (!choice) {
          card.setVisible(false);
          card.choice = null;
          card.isUnlock = false;
          return;
        }

        const isUnlock = choice.key?.startsWith('unlock');
        card.setVisible(true);
        card.choice = choice;
        card.isUnlock = isUnlock;
        card.hoverFill = isUnlock ? 0x243a2b : 0x1f4561;
        card.background.setFillStyle(isUnlock ? 0x1b2f22 : 0x163042, 0.96);
        card.background.setStrokeStyle(2, isUnlock ? 0xa6f0b8 : 0x89c7ff, isUnlock ? 0.75 : 0.65);
        card.badge.setText(isUnlock ? 'UNLOCK' : 'UPGRADE');
        card.badge.setStyle({
          fontFamily: 'Trebuchet MS',
          fontSize: '13px',
          color: isUnlock ? '#0e1b14' : '#0d1721',
          fontStyle: 'bold',
          backgroundColor: isUnlock ? '#a6f0b8' : '#89c7ff',
          padding: { left: 8, right: 8, top: 2, bottom: 2 }
        });
        card.title.setText(choice.label);
        card.description.setText(choice.description);
        card.hint.setText(isUnlock ? `New ability - press ${index + 1} or click` : `Press ${index + 1} or click`);
      });

      container.setVisible(true);
    },
    chooseIndex(index) {
      chooseCardByIndex(cards, index, onSelect);
    },
    choosePointer(pointerX, pointerY) {
      return chooseCardByPointer(cards, pointerX, pointerY, onSelect);
    }
  };
}

export function createChestOverlay(scene, onSelect) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, 0x090503, 0.82).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 940, 420, 0x1c120b, 0.97).setStrokeStyle(2, 0xe2b96c, 0.7);
  const title = scene.add.text(0, -150, 'Elite Chest', {
    fontFamily: 'Trebuchet MS',
    fontSize: '40px',
    color: '#fff2d6',
    fontStyle: 'bold'
  });
  const subtitle = scene.add.text(0, -104, 'Choose one relic reward before the swarm closes back in.', {
    fontFamily: 'Trebuchet MS',
    fontSize: '18px',
    color: '#f0d7aa'
  });
  const cards = [createButtonCard(scene, onSelect), createButtonCard(scene, onSelect), createButtonCard(scene, onSelect)];
  const container = scene.add.container(0, 0, [backdrop, panel, title, subtitle, ...cards]);

  title.setOrigin(0.5);
  subtitle.setOrigin(0.5);
  container.setDepth(61);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    hide() {
      container.setVisible(false);
    },
    layout(width, height) {
      backdrop.setSize(width, height);
      panel.setPosition(width / 2, height / 2);
      title.setPosition(width / 2, height / 2 - 150);
      subtitle.setPosition(width / 2, height / 2 - 104);

      const compact = width < 1024;
      cards.forEach((card, index) => {
        const x = compact ? width / 2 : width / 2 - 300 + index * 300;
        const y = compact ? height / 2 - 5 + index * 115 : height / 2 + 50;
        card.setPosition(x, y);
        card.setScale(compact ? 0.82 : 1);
      });
    },
    show(choices) {
      cards.forEach((card, index) => {
        const choice = getChoiceByIndex(choices, index);

        if (!choice) {
          card.setVisible(false);
          card.choice = null;
          return;
        }

        card.setVisible(true);
        card.choice = choice;
        card.hoverFill = 0x4a2f18;
        card.background.setFillStyle(0x2d2013, 0.98);
        card.background.setStrokeStyle(2, 0xe2b96c, 0.78);
        card.badge.setText('REWARD');
        card.badge.setStyle({
          fontFamily: 'Trebuchet MS',
          fontSize: '13px',
          color: '#201309',
          fontStyle: 'bold',
          backgroundColor: '#f0c778',
          padding: { left: 8, right: 8, top: 2, bottom: 2 }
        });
        card.title.setText(choice.label);
        card.description.setText(choice.description);
        card.hint.setText(`Press ${index + 1} or click`);
      });

      container.setVisible(true);
    },
    chooseIndex(index) {
      chooseCardByIndex(cards, index, onSelect);
    },
    choosePointer(pointerX, pointerY) {
      return chooseCardByPointer(cards, pointerX, pointerY, onSelect);
    }
  };
}

export function createGameOverOverlay(scene, onRestart) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, 0x02060a, 0.82).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 520, 320, 0x0b1926, 0.97).setStrokeStyle(2, 0xff8b73, 0.7);
  const title = scene.add.text(0, 0, 'Run Over', {
    fontFamily: 'Trebuchet MS',
    fontSize: '38px',
    color: '#ffe0d7',
    fontStyle: 'bold'
  });
  const summary = scene.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px',
    align: 'center',
    color: '#d6e7f7'
  });
  const restartButton = scene.add
    .rectangle(0, 0, 220, 54, 0x9d402e, 1)
    .setStrokeStyle(2, 0xffb4a2, 0.8);
  const restartText = scene.add.text(0, 0, 'Restart (R)', {
    fontFamily: 'Trebuchet MS',
    fontSize: '22px',
    color: '#fff7f0'
  });
  const container = scene.add.container(0, 0, [backdrop, panel, title, summary, restartButton, restartText]);

  title.setOrigin(0.5);
  summary.setOrigin(0.5);
  restartText.setOrigin(0.5);
  container.setDepth(70);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    hide() {
      container.setVisible(false);
    },
    layout(width, height) {
      backdrop.setSize(width, height);
      panel.setPosition(width / 2, height / 2);
      title.setPosition(width / 2, height / 2 - 84);
      summary.setPosition(width / 2, height / 2 - 10);
      restartButton.setPosition(width / 2, height / 2 + 92);
      restartText.setPosition(width / 2, height / 2 + 92);
    },
    show({ timeMs, level }) {
      summary.setText(`You held out for ${formatTime(timeMs)}\nReached level ${level}`);
      container.setVisible(true);
    },
    choosePointer(pointerX, pointerY) {
      const width = 220;
      const height = 54;
      const withinX =
        pointerX >= restartButton.x - width / 2 && pointerX <= restartButton.x + width / 2;
      const withinY =
        pointerY >= restartButton.y - height / 2 && pointerY <= restartButton.y + height / 2;

      if (!container.visible || !withinX || !withinY) {
        restartButton.setFillStyle(0x9d402e, 1);
        return false;
      }

      restartButton.setFillStyle(0xbf4f39, 1);
      onRestart();
      return true;
    }
  };
}
