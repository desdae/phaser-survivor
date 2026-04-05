const JOURNAL_THEME = {
  modalWidth: 1120,
  modalHeight: 620,
  frameInset: 16,
  contentInset: 20,
  leftPanelWidth: 304,
  contentHeight: 470,
  titlePlaqueWidth: 430,
  titlePlaqueHeight: 84,
  tabWidth: 150,
  tabHeight: 40,
  closeSize: 50,
  portraitWidth: 244,
  portraitHeight: 304,
  listRowStep: 46,
  listVisibleRows: 9,
  listScrollStep: 1,
  colors: {
    backdrop: 0x040507,
    vignette: 0x000000,
    stoneDark: 0x15110f,
    stoneMid: 0x231a17,
    stoneWarm: 0x342721,
    rust: 0x5d3428,
    bronze: 0x8c7550,
    bronzeDim: 0x5c4a34,
    parchment: 0xd7c4a0,
    parchmentDim: 0xb7a48a,
    ember: 0xa34d34,
    emberGlow: 0xd57a42,
    bone: 0xe7dcc8,
    smoke: 0x3a302d,
    shadowBlue: 0x0d1017,
    moss: 0x6b7c59
  },
  fonts: {
    title: {
      fontFamily: 'Georgia',
      fontSize: '40px',
      color: '#efe1c5',
      fontStyle: 'bold',
      stroke: '#241510',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    },
    tabActive: {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f0dfbc',
      fontStyle: 'bold',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true
      }
    },
    tabInactive: {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#9a8a74',
      fontStyle: 'bold'
    },
    rowKnown: {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#dcc7a6',
      fontStyle: 'bold'
    },
    rowUnknown: {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#8a8072',
      fontStyle: 'bold'
    },
    detailTitle: {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#f0d7ab',
      fontStyle: 'bold',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 5,
        fill: true
      }
    },
    body: {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#d8c3a1'
    },
    bodyDim: {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#baa789'
    },
    stat: {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#ead9bb'
    },
    section: {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d1b07a',
      fontStyle: 'bold'
    },
    close: {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f1d6c8',
      fontStyle: 'bold'
    }
  }
};

function getJournalLayout(width, height) {
  const panelLeft = Math.round((width - JOURNAL_THEME.modalWidth) / 2);
  const panelTop = Math.round((height - JOURNAL_THEME.modalHeight) / 2);
  const leftPanelX = JOURNAL_THEME.contentInset;
  const contentTop = 126;
  const leftPanelY = contentTop;
  const rightPanelX = leftPanelX + JOURNAL_THEME.leftPanelWidth + JOURNAL_THEME.contentInset;
  const rightPanelWidth =
    JOURNAL_THEME.modalWidth - rightPanelX - JOURNAL_THEME.contentInset;

  return {
    width,
    height,
    panelLeft,
    panelTop,
    panelWidth: JOURNAL_THEME.modalWidth,
    panelHeight: JOURNAL_THEME.modalHeight,
    titleY: 42,
    tabY: 90,
    leftPanelX,
    leftPanelY,
    leftPanelWidth: JOURNAL_THEME.leftPanelWidth,
    rightPanelX,
    rightPanelY: contentTop,
    rightPanelWidth,
    contentHeight: JOURNAL_THEME.contentHeight,
    portraitX: rightPanelX + 26,
    portraitY: contentTop + 118,
    detailStartX: rightPanelX + 296,
    detailTitleY: contentTop + 34,
    detailDescriptionY: contentTop + 84,
    upgradeY: contentTop + 336
  };
}

function applyTextStyle(textNode, style) {
  textNode.setStyle(style);
}

function setRectStyle(node, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth = 2) {
  node.setFillStyle(fillColor, fillAlpha);
  node.setStrokeStyle(strokeWidth, strokeColor, strokeAlpha);
}

function createDisplayImage(scene, key) {
  if (typeof scene.add.image === 'function') {
    return scene.add.image(0, 0, key);
  }

  return scene.add.rectangle(0, 0, JOURNAL_THEME.portraitWidth - 30, JOURNAL_THEME.portraitHeight - 30, 0x2d201c, 0.9);
}

function pulseFlame(flame, scene, delay = 0) {
  scene.tweens?.add?.({
    targets: flame,
    scaleX: 1.08,
    scaleY: 0.88,
    alpha: 0.72,
    duration: 950,
    yoyo: true,
    repeat: -1,
    delay,
    ease: 'Sine.easeInOut'
  });
}

function driftAmbient(nodes, scene, distance, duration, delay = 0) {
  scene.tweens?.add?.({
    targets: nodes,
    y: `-=${distance}`,
    alpha: { from: 0.18, to: 0.04 },
    duration,
    yoyo: true,
    repeat: -1,
    delay,
    ease: 'Sine.easeInOut'
  });
}

export function createJournalOverlay(scene) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, JOURNAL_THEME.colors.backdrop, 0.9).setOrigin(0);
  const vignetteTop = scene.add.rectangle(0, 0, 100, 120, JOURNAL_THEME.colors.vignette, 0.18).setOrigin(0);
  const vignetteBottom = scene.add.rectangle(0, 0, 100, 150, JOURNAL_THEME.colors.vignette, 0.24).setOrigin(0);
  const frameShadow = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth + 24, JOURNAL_THEME.modalHeight + 24, 0x000000, 0.36).setOrigin(0.5);
  const frameOuter = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth, JOURNAL_THEME.modalHeight, JOURNAL_THEME.colors.stoneDark, 0.98).setOrigin(0.5);
  const frameInner = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth - 12, JOURNAL_THEME.modalHeight - 12, JOURNAL_THEME.colors.stoneMid, 0.94).setOrigin(0.5);
  const mainSurface = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth - 36, JOURNAL_THEME.modalHeight - 40, JOURNAL_THEME.colors.stoneWarm, 0.32).setOrigin(0.5);
  const topBar = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth - 18, 82, JOURNAL_THEME.colors.stoneDark, 0.84).setOrigin(0.5);
  const topBarGlow = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth - 22, 6, JOURNAL_THEME.colors.rust, 0.18).setOrigin(0.5);
  const bottomBar = scene.add.rectangle(0, 0, JOURNAL_THEME.modalWidth - 18, 34, JOURNAL_THEME.colors.stoneDark, 0.62).setOrigin(0.5);

  const titlePlaqueShadow = scene.add.rectangle(0, 0, JOURNAL_THEME.titlePlaqueWidth + 18, JOURNAL_THEME.titlePlaqueHeight + 12, 0x000000, 0.28).setOrigin(0.5);
  const titlePlaque = scene.add.rectangle(0, 0, JOURNAL_THEME.titlePlaqueWidth, JOURNAL_THEME.titlePlaqueHeight, 0x1d1412, 0.97).setOrigin(0.5);
  const titlePlaqueInner = scene.add.rectangle(0, 0, JOURNAL_THEME.titlePlaqueWidth - 18, JOURNAL_THEME.titlePlaqueHeight - 18, 0x2b211d, 0.72).setOrigin(0.5);
  const skullLeft = scene.add.text(0, 0, '☠', {
    fontFamily: 'Georgia',
    fontSize: '34px',
    color: '#d7ccb9'
  }).setOrigin(0.5);
  const skullCenter = scene.add.text(0, 0, '☠', {
    fontFamily: 'Georgia',
    fontSize: '40px',
    color: '#dccfbc'
  }).setOrigin(0.5);
  const skullRight = scene.add.text(0, 0, '☠', {
    fontFamily: 'Georgia',
    fontSize: '34px',
    color: '#d7ccb9'
  }).setOrigin(0.5);
  const title = scene.add.text(0, 0, 'Journal', JOURNAL_THEME.fonts.title).setOrigin(0.5);

  const enemyTabPlate = scene.add.rectangle(0, 0, JOURNAL_THEME.tabWidth, JOURNAL_THEME.tabHeight, 0x2c211d, 0.96).setOrigin(0.5);
  const abilitiesTabPlate = scene.add.rectangle(0, 0, JOURNAL_THEME.tabWidth, JOURNAL_THEME.tabHeight, 0x2c211d, 0.96).setOrigin(0.5);
  const enemyTab = scene.add.text(0, 0, 'Enemies', JOURNAL_THEME.fonts.tabActive).setOrigin(0.5);
  const abilitiesTab = scene.add.text(0, 0, 'Abilities', JOURNAL_THEME.fonts.tabInactive).setOrigin(0.5);
  const enemyTabUnderline = scene.add.rectangle(0, 0, JOURNAL_THEME.tabWidth - 26, 3, JOURNAL_THEME.colors.emberGlow, 0.32).setOrigin(0.5);
  const abilitiesTabUnderline = scene.add.rectangle(0, 0, JOURNAL_THEME.tabWidth - 26, 3, JOURNAL_THEME.colors.emberGlow, 0.18).setOrigin(0.5);

  const leftPanel = scene.add.rectangle(0, 0, JOURNAL_THEME.leftPanelWidth, JOURNAL_THEME.contentHeight, 0x1b1512, 0.9).setOrigin(0, 0);
  const leftPanelInner = scene.add.rectangle(0, 0, JOURNAL_THEME.leftPanelWidth - 18, JOURNAL_THEME.contentHeight - 18, 0x2b211d, 0.34).setOrigin(0, 0);
  const rightPanel = scene.add.rectangle(0, 0, 0, JOURNAL_THEME.contentHeight, 0x1a1412, 0.9).setOrigin(0, 0);
  const rightPanelInner = scene.add.rectangle(0, 0, 0, JOURNAL_THEME.contentHeight - 18, 0x3a2c24, 0.18).setOrigin(0, 0);
  const portraitFrameShadow = scene.add.rectangle(0, 0, JOURNAL_THEME.portraitWidth + 14, JOURNAL_THEME.portraitHeight + 14, 0x000000, 0.28).setOrigin(0, 0);
  const portraitFrame = scene.add.rectangle(0, 0, JOURNAL_THEME.portraitWidth, JOURNAL_THEME.portraitHeight, 0x16110d, 0.96).setOrigin(0, 0);
  const portraitMat = scene.add.rectangle(0, 0, JOURNAL_THEME.portraitWidth - 18, JOURNAL_THEME.portraitHeight - 18, 0x241b16, 0.76).setOrigin(0, 0);
  const portraitImage = createDisplayImage(scene, 'mob-skeleton-1');
  portraitImage.setOrigin?.(0.5);
  portraitImage.setVisible?.(false);

  const detailTitle = scene.add.text(0, 0, '', JOURNAL_THEME.fonts.detailTitle);
  const detailDescription = scene.add.text(0, 0, '', {
    ...JOURNAL_THEME.fonts.body,
    wordWrap: { width: 380 }
  });
  const topDivider = scene.add.rectangle(0, 0, 0, 2, JOURNAL_THEME.colors.bronze, 0.28).setOrigin(0, 0.5);
  const statDivider = scene.add.rectangle(0, 0, 0, 1, JOURNAL_THEME.colors.bronzeDim, 0.24).setOrigin(0, 0.5);
  const detailRows = Array.from({ length: 8 }, () => scene.add.text(0, 0, '', JOURNAL_THEME.fonts.stat));
  const upgradeHeader = scene.add.text(0, 0, 'Upgrade Paths', JOURNAL_THEME.fonts.section);
  const upgradeRows = Array.from({ length: 8 }, () => scene.add.text(0, 0, '', JOURNAL_THEME.fonts.bodyDim));

  const closePlate = scene.add.rectangle(0, 0, JOURNAL_THEME.closeSize, JOURNAL_THEME.closeSize, 0x6c2419, 0.95).setOrigin(0.5);
  const closePlateInner = scene.add.rectangle(0, 0, JOURNAL_THEME.closeSize - 8, JOURNAL_THEME.closeSize - 8, 0x892d1f, 0.45).setOrigin(0.5);
  const closeGlyph = scene.add.text(0, 0, '✕', JOURNAL_THEME.fonts.close).setOrigin(0.5);

  const candles = [
    {
      wax: scene.add.rectangle(0, 0, 18, 56, 0xcfb69a, 0.92).setOrigin(0.5, 1),
      flame: scene.add.rectangle(0, 0, 10, 18, JOURNAL_THEME.colors.emberGlow, 0.82).setOrigin(0.5, 1)
    },
    {
      wax: scene.add.rectangle(0, 0, 18, 56, 0xcfb69a, 0.92).setOrigin(0.5, 1),
      flame: scene.add.rectangle(0, 0, 10, 18, JOURNAL_THEME.colors.emberGlow, 0.82).setOrigin(0.5, 1)
    }
  ];
  const smokePuffs = Array.from({ length: 4 }, () =>
    scene.add.rectangle(0, 0, 28, 18, JOURNAL_THEME.colors.smoke, 0.12).setOrigin(0.5)
  );
  const emberMotes = Array.from({ length: 6 }, () =>
    scene.add.rectangle(0, 0, 3, 3, JOURNAL_THEME.colors.emberGlow, 0.22).setOrigin(0.5)
  );

  const rowBackgrounds = Array.from({ length: 12 }, () =>
    scene.add.rectangle(0, 0, JOURNAL_THEME.leftPanelWidth - 40, 31, 0x2f241f, 0.12).setOrigin(0, 0)
  );
  const rowTexts = Array.from({ length: 12 }, () => scene.add.text(0, 0, '', JOURNAL_THEME.fonts.rowKnown));
  const listScrollTrack = scene.add.rectangle(0, 0, 12, 0, 0x241916, 0.7).setOrigin(0, 0);
  const listScrollThumb = scene.add.rectangle(0, 0, 10, 0, JOURNAL_THEME.colors.parchment, 0.9).setOrigin(0, 0);

  const container = scene.add.container(0, 0, [
    backdrop,
    vignetteTop,
    vignetteBottom,
    frameShadow,
    frameOuter,
    frameInner,
    mainSurface,
    topBar,
    topBarGlow,
    bottomBar,
    titlePlaqueShadow,
    titlePlaque,
    titlePlaqueInner,
    skullLeft,
    skullCenter,
    skullRight,
    title,
    enemyTabPlate,
    abilitiesTabPlate,
    enemyTabUnderline,
    abilitiesTabUnderline,
    enemyTab,
    abilitiesTab,
    leftPanel,
    leftPanelInner,
    rightPanel,
    rightPanelInner,
    portraitFrameShadow,
    portraitFrame,
    portraitMat,
    portraitImage,
    detailTitle,
    detailDescription,
    topDivider,
    statDivider,
    ...detailRows,
    upgradeHeader,
    ...upgradeRows,
    ...rowBackgrounds,
    ...rowTexts,
    listScrollTrack,
    listScrollThumb,
    closePlate,
    closePlateInner,
    closeGlyph,
    ...candles.flatMap((candle) => [candle.wax, candle.flame]),
    ...smokePuffs,
    ...emberMotes
  ]);

  container.setDepth(68);
  container.setScrollFactor(0);
  container.setVisible(false);

  setRectStyle(frameOuter, JOURNAL_THEME.colors.stoneDark, 0.98, JOURNAL_THEME.colors.bronzeDim, 0.55, 4);
  setRectStyle(frameInner, JOURNAL_THEME.colors.stoneMid, 0.94, JOURNAL_THEME.colors.bronze, 0.22, 2);
  setRectStyle(topBar, JOURNAL_THEME.colors.stoneDark, 0.86, JOURNAL_THEME.colors.bronzeDim, 0.22, 2);
  setRectStyle(titlePlaque, 0x1d1412, 0.98, JOURNAL_THEME.colors.bronze, 0.5, 3);
  setRectStyle(titlePlaqueInner, 0x2f241f, 0.62, JOURNAL_THEME.colors.bronzeDim, 0.15, 1);
  setRectStyle(enemyTabPlate, 0x2b201c, 0.98, JOURNAL_THEME.colors.bronze, 0.28, 2);
  setRectStyle(abilitiesTabPlate, 0x2b201c, 0.98, JOURNAL_THEME.colors.bronze, 0.18, 2);
  setRectStyle(leftPanel, 0x1a1412, 0.92, JOURNAL_THEME.colors.bronzeDim, 0.45, 2);
  setRectStyle(leftPanelInner, 0x322722, 0.18, JOURNAL_THEME.colors.bronzeDim, 0.18, 1);
  setRectStyle(rightPanel, 0x181311, 0.92, JOURNAL_THEME.colors.bronzeDim, 0.38, 2);
  setRectStyle(rightPanelInner, 0x3a2c24, 0.16, JOURNAL_THEME.colors.bronze, 0.12, 1);
  setRectStyle(listScrollTrack, 0x201612, 0.8, JOURNAL_THEME.colors.bronzeDim, 0.12, 1);
  setRectStyle(listScrollThumb, JOURNAL_THEME.colors.parchment, 0.88, JOURNAL_THEME.colors.bronze, 0.2, 1);
  setRectStyle(portraitFrame, 0x16110d, 0.96, JOURNAL_THEME.colors.bronze, 0.42, 2);
  setRectStyle(portraitMat, 0x2c211c, 0.72, JOURNAL_THEME.colors.bronzeDim, 0.14, 1);
  setRectStyle(closePlate, 0x6c2419, 0.95, JOURNAL_THEME.colors.bone, 0.26, 2);
  setRectStyle(closePlateInner, 0x8b2d1f, 0.35, JOURNAL_THEME.colors.bronze, 0.18, 1);

  pulseFlame(candles[0].flame, scene, 0);
  pulseFlame(candles[1].flame, scene, 240);
  driftAmbient(smokePuffs, scene, 8, 2200, 160);
  driftAmbient(emberMotes, scene, 14, 1800, 40);

  let activeTab = 'enemies';
  let currentPayload = null;
  let currentState = {
    activeTab: 'enemies',
    detailTitle: '',
    selectedRowKey: null,
    listScrollOffset: 0,
    listCanScroll: false,
    hasPortraitFrame: true,
    ambient: {
      candleCount: 2,
      emberCount: emberMotes.length,
      smokeCount: smokePuffs.length
    },
    layout: getJournalLayout(scene.scale?.width ?? 1280, scene.scale?.height ?? 720)
  };
  let tabBounds = [];
  let closeBounds = null;
  let rowBounds = [];
  let listBounds = null;
  let listScrollBounds = null;
  let listScrollLocalBounds = null;
  const scrollOffsets = {
    enemies: 0,
    abilities: 0
  };

  function clampScrollOffset(entries) {
    const maxOffset = Math.max(0, entries.length - JOURNAL_THEME.listVisibleRows);
    const nextOffset = Math.min(maxOffset, Math.max(0, scrollOffsets[activeTab] ?? 0));
    scrollOffsets[activeTab] = nextOffset;
    currentState.listScrollOffset = nextOffset;
    currentState.listCanScroll = maxOffset > 0;
    return nextOffset;
  }

  function estimateWrappedLineCount(text, maxCharsPerLine = 42) {
    if (!text) {
      return 1;
    }

    return String(text)
      .split('\n')
      .reduce((lineCount, line) => lineCount + Math.max(1, Math.ceil(line.length / maxCharsPerLine)), 0);
  }

  function updateScrollVisual(entries) {
    const trackHeight = JOURNAL_THEME.listVisibleRows * JOURNAL_THEME.listRowStep - 12;
    const maxOffset = Math.max(0, entries.length - JOURNAL_THEME.listVisibleRows);
    const canScroll = maxOffset > 0;

    listScrollTrack.setVisible(canScroll);
    listScrollThumb.setVisible(canScroll);

    if (!canScroll || !listScrollBounds || !listScrollLocalBounds) {
      return;
    }

    const thumbHeight = Math.max(42, Math.round(trackHeight * (JOURNAL_THEME.listVisibleRows / entries.length)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    const ratio = maxOffset === 0 ? 0 : scrollOffsets[activeTab] / maxOffset;
    const thumbY = listScrollLocalBounds.y + Math.round(travel * ratio);

    listScrollTrack.setPosition(listScrollLocalBounds.x, listScrollLocalBounds.y);
    listScrollTrack.setSize(listScrollLocalBounds.width, trackHeight);
    listScrollThumb.setPosition(listScrollLocalBounds.x + 1, thumbY + 1);
    listScrollThumb.setSize(listScrollLocalBounds.width - 2, thumbHeight - 2);
  }

  function updateTabStyles() {
    const isEnemies = activeTab === 'enemies';
    applyTextStyle(enemyTab, isEnemies ? JOURNAL_THEME.fonts.tabActive : JOURNAL_THEME.fonts.tabInactive);
    applyTextStyle(abilitiesTab, isEnemies ? JOURNAL_THEME.fonts.tabInactive : JOURNAL_THEME.fonts.tabActive);
    enemyTabUnderline.setFillStyle(JOURNAL_THEME.colors.emberGlow, isEnemies ? 0.4 : 0.12);
    abilitiesTabUnderline.setFillStyle(JOURNAL_THEME.colors.emberGlow, isEnemies ? 0.12 : 0.4);
    enemyTabPlate.setFillStyle(isEnemies ? 0x382823 : 0x261c19, 0.98);
    abilitiesTabPlate.setFillStyle(isEnemies ? 0x261c19 : 0x382823, 0.98);
  }

  function updateRows(payload) {
    const entries = activeTab === 'enemies' ? payload.enemies ?? [] : payload.abilities ?? [];
    const selectedKey = payload.selectedKey ?? payload.detail?.key ?? entries[0]?.key ?? null;
    const layout = currentState.layout;
    const scrollOffset = clampScrollOffset(entries);
    const visibleEntries = entries.slice(scrollOffset, scrollOffset + JOURNAL_THEME.listVisibleRows);
    currentState.selectedRowKey = selectedKey;
    rowBounds = [];

    rowTexts.forEach((rowText, index) => {
      const rowBackground = rowBackgrounds[index];
      const entry = visibleEntries[index];

      if (!entry) {
        rowText.setText('');
        rowBackground.setVisible(false);
        rowText.setVisible(false);
        return;
      }

      rowBackground.setVisible(true);
      rowText.setVisible(true);
      rowText.setText(entry.label);

      const isSelected = entry.key === selectedKey;
      const knownStyle = entry.discovered ? JOURNAL_THEME.fonts.rowKnown : JOURNAL_THEME.fonts.rowUnknown;
      applyTextStyle(rowText, knownStyle);

      if (isSelected) {
        rowBackground.setFillStyle(JOURNAL_THEME.colors.ember, 0.42);
        rowBackground.setStrokeStyle(1, JOURNAL_THEME.colors.emberGlow, 0.38);
        rowText.setStyle({
          ...knownStyle,
          color: entry.discovered ? '#f2ddb7' : '#b19984'
        });
      } else {
        rowBackground.setFillStyle(0x2d211d, entry.discovered ? 0.16 : 0.08);
        rowBackground.setStrokeStyle(1, JOURNAL_THEME.colors.bronzeDim, 0.12);
      }

      rowBounds.push({
        key: entry.key,
        tab: activeTab,
        x: layout.panelLeft + layout.leftPanelX + 16,
        y: layout.panelTop + layout.leftPanelY + 34 + index * JOURNAL_THEME.listRowStep,
        width: layout.leftPanelWidth - 32,
        height: 34
      });
    });

    rowBackgrounds
      .slice(visibleEntries.length)
      .forEach((rowBackground) => rowBackground.setVisible(false));

    updateScrollVisual(entries);
  }

  function updateDetail(payload) {
    const detail = payload.detail ?? { title: '', rows: [], description: '', upgradePaths: [] };
    const layout = currentState.layout;
    const statRowsData = detail.rows ?? [];
    const upgradePathData = detail.upgradePaths ?? [];
    currentState.detailTitle = detail.title ?? '';
    detailTitle.setText(detail.title ?? '');
    detailDescription.setText(detail.description ?? '');

    const portraitKey = detail.textureKey ?? detail.iconKey ?? null;
    if (portraitKey && portraitImage.setTexture) {
      portraitImage.setTexture(portraitKey);
      portraitImage.setVisible(true);
    } else {
      portraitImage.setVisible?.(Boolean(portraitKey));
    }

    detailRows.forEach((rowText, index) => {
      const row = statRowsData[index];
      rowText.setText(row ? `${row.label} ${row.value}` : '');
      rowText.setVisible(Boolean(row));
    });

    const statsStartY = layout.rightPanelY + 156;
    const statsEndY = statsStartY + statRowsData.length * 40;
    const upgradeStartY = Math.max(layout.upgradeY, statsEndY + 12);

    detailRows.forEach((rowText, index) => {
      if (!statRowsData[index]) {
        return;
      }

      rowText.setPosition(layout.detailStartX, statsStartY + index * 40);
    });

    const hasUpgrades = upgradePathData.length > 0;
    upgradeHeader.setVisible(hasUpgrades);
    upgradeHeader.setPosition(layout.detailStartX, upgradeStartY);
    statDivider.setPosition(layout.detailStartX, upgradeStartY - 16);
    statDivider.setSize(layout.rightPanelWidth - 322, 1);

    let nextUpgradeY = upgradeStartY + 32;
    upgradeRows.forEach((rowText, index) => {
      const row = upgradePathData[index];

      if (!row) {
        rowText.setText('');
        rowText.setVisible(false);
        return;
      }

      const lineCount = estimateWrappedLineCount(`${row.label} ${row.value}`);
      rowText.setPosition(layout.detailStartX, nextUpgradeY);
      rowText.setStyle({
        ...JOURNAL_THEME.fonts.bodyDim,
        wordWrap: { width: Math.max(280, layout.rightPanelWidth - 330) }
      });
      rowText.setText(`${row.label} ${row.value}`);
      rowText.setVisible(Boolean(row));
      nextUpgradeY += 18 * lineCount + 8;
    });
  }

  function applyPayload(payload) {
    currentPayload = payload;
    activeTab = payload.activeTab ?? activeTab;
    updateTabStyles();
    updateRows(payload);
    updateDetail(payload);
  }

  return {
    show(payload) {
      container.setVisible(true);
      applyPayload(payload);
    },
    hide() {
      container.setVisible(false);
    },
    update(payload) {
      applyPayload(payload);
    },
    layout(width, height) {
      const layout = getJournalLayout(width, height);
      currentState.layout = layout;
      container.setPosition(layout.panelLeft, layout.panelTop);

      backdrop.setPosition(-layout.panelLeft, -layout.panelTop);
      backdrop.setSize(width, height);
      vignetteTop.setPosition(-layout.panelLeft, -layout.panelTop);
      vignetteTop.setSize(width, 120);
      vignetteBottom.setPosition(-layout.panelLeft, height - layout.panelTop - 150);
      vignetteBottom.setSize(width, 150);

      frameShadow.setPosition(layout.panelWidth / 2, layout.panelHeight / 2 + 6);
      frameOuter.setPosition(layout.panelWidth / 2, layout.panelHeight / 2);
      frameInner.setPosition(layout.panelWidth / 2, layout.panelHeight / 2);
      mainSurface.setPosition(layout.panelWidth / 2, layout.panelHeight / 2 + 3);
      topBar.setPosition(layout.panelWidth / 2, 58);
      topBarGlow.setPosition(layout.panelWidth / 2, 96);
      topBarGlow.setSize(layout.panelWidth - 34, 6);
      bottomBar.setPosition(layout.panelWidth / 2, layout.panelHeight - 18);
      titlePlaqueShadow.setPosition(layout.panelWidth / 2, layout.titleY + 4);
      titlePlaque.setPosition(layout.panelWidth / 2, layout.titleY);
      titlePlaqueInner.setPosition(layout.panelWidth / 2, layout.titleY + 1);
      title.setPosition(layout.panelWidth / 2, layout.titleY - 1);
      skullLeft.setPosition(layout.panelWidth / 2 - 190, layout.titleY - 2);
      skullCenter.setPosition(layout.panelWidth / 2, layout.titleY - 22);
      skullRight.setPosition(layout.panelWidth / 2 + 190, layout.titleY - 2);

      enemyTabPlate.setPosition(layout.leftPanelX + 360, layout.tabY);
      abilitiesTabPlate.setPosition(layout.leftPanelX + 520, layout.tabY);
      enemyTab.setPosition(layout.leftPanelX + 360, layout.tabY - 2);
      abilitiesTab.setPosition(layout.leftPanelX + 520, layout.tabY - 2);
      enemyTabUnderline.setPosition(layout.leftPanelX + 360, layout.tabY + 18);
      abilitiesTabUnderline.setPosition(layout.leftPanelX + 520, layout.tabY + 18);

      leftPanel.setPosition(layout.leftPanelX, layout.leftPanelY);
      leftPanel.setSize(layout.leftPanelWidth, layout.contentHeight);
      leftPanelInner.setPosition(layout.leftPanelX + 9, layout.leftPanelY + 9);
      leftPanelInner.setSize(layout.leftPanelWidth - 18, layout.contentHeight - 18);

      rightPanel.setPosition(layout.rightPanelX, layout.rightPanelY);
      rightPanel.setSize(layout.rightPanelWidth, layout.contentHeight);
      rightPanelInner.setPosition(layout.rightPanelX + 9, layout.rightPanelY + 9);
      rightPanelInner.setSize(layout.rightPanelWidth - 18, layout.contentHeight - 18);

      portraitFrameShadow.setPosition(layout.portraitX - 7, layout.portraitY - 7);
      portraitFrame.setPosition(layout.portraitX, layout.portraitY);
      portraitMat.setPosition(layout.portraitX + 9, layout.portraitY + 9);
      portraitImage.setPosition(layout.portraitX + JOURNAL_THEME.portraitWidth / 2, layout.portraitY + JOURNAL_THEME.portraitHeight / 2);
      portraitImage.setDisplaySize?.(JOURNAL_THEME.portraitWidth - 34, JOURNAL_THEME.portraitHeight - 34);

      detailTitle.setPosition(layout.detailStartX, layout.detailTitleY);
      detailDescription.setPosition(layout.detailStartX, layout.detailDescriptionY);
      topDivider.setPosition(layout.detailStartX, layout.rightPanelY + 98);
      topDivider.setSize(layout.rightPanelWidth - 322, 2);
      statDivider.setPosition(layout.detailStartX, layout.rightPanelY + 198);
      statDivider.setSize(layout.rightPanelWidth - 322, 1);

      detailRows.forEach((rowText, index) => {
        rowText.setPosition(layout.detailStartX, layout.rightPanelY + 156 + index * 40);
      });

      rowBounds = [];
      rowBackgrounds.forEach((rowBackground, index) => {
        const rowY = layout.leftPanelY + 34 + index * JOURNAL_THEME.listRowStep;
        rowBackground.setPosition(layout.leftPanelX + 16, rowY);
        rowBackground.setSize(layout.leftPanelWidth - 32, 34);
      });
      rowTexts.forEach((rowText, index) => {
        rowText.setPosition(layout.leftPanelX + 28, layout.leftPanelY + 39 + index * JOURNAL_THEME.listRowStep);
      });
      listBounds = {
        x: layout.panelLeft + layout.leftPanelX + 16,
        y: layout.panelTop + layout.leftPanelY + 34,
        width: layout.leftPanelWidth - 32,
        height: JOURNAL_THEME.listVisibleRows * JOURNAL_THEME.listRowStep
      };
      listScrollBounds = {
        x: layout.panelLeft + layout.leftPanelX + layout.leftPanelWidth - 20,
        y: layout.panelTop + layout.leftPanelY + 34,
        width: 12,
        height: JOURNAL_THEME.listVisibleRows * JOURNAL_THEME.listRowStep - 12
      };
      listScrollLocalBounds = {
        x: layout.leftPanelX + layout.leftPanelWidth - 20,
        y: layout.leftPanelY + 34,
        width: 12,
        height: JOURNAL_THEME.listVisibleRows * JOURNAL_THEME.listRowStep - 12
      };

      closePlate.setPosition(layout.panelWidth - 42, 42);
      closePlateInner.setPosition(layout.panelWidth - 42, 42);
      closeGlyph.setPosition(layout.panelWidth - 42, 42);

      candles[0].wax.setPosition(24, layout.panelHeight - 22);
      candles[0].flame.setPosition(24, layout.panelHeight - 76);
      candles[1].wax.setPosition(layout.panelWidth - 24, layout.panelHeight - 22);
      candles[1].flame.setPosition(layout.panelWidth - 24, layout.panelHeight - 76);

      smokePuffs.forEach((puff, index) => {
        puff.setPosition(index < 2 ? 36 : layout.panelWidth - 40, layout.panelHeight - 120 - index * 18);
      });
      emberMotes.forEach((ember, index) => {
        ember.setPosition(
          index < 3 ? 56 + index * 18 : layout.panelWidth - 92 + (index - 3) * 18,
          layout.panelHeight - 142 - index * 8
        );
      });

      tabBounds = [
        {
          tab: 'enemies',
          x: layout.panelLeft + layout.leftPanelX + 285,
          y: layout.panelTop + layout.tabY - JOURNAL_THEME.tabHeight / 2,
          width: JOURNAL_THEME.tabWidth,
          height: JOURNAL_THEME.tabHeight
        },
        {
          tab: 'abilities',
          x: layout.panelLeft + layout.leftPanelX + 445,
          y: layout.panelTop + layout.tabY - JOURNAL_THEME.tabHeight / 2,
          width: JOURNAL_THEME.tabWidth,
          height: JOURNAL_THEME.tabHeight
        }
      ];
      closeBounds = {
        x: layout.panelLeft + layout.panelWidth - 67,
        y: layout.panelTop + 17,
        width: JOURNAL_THEME.closeSize,
        height: JOURNAL_THEME.closeSize
      };

      rowBounds = rowBounds.map((bounds, index) => ({
        ...bounds,
        x: layout.panelLeft + layout.leftPanelX + 16,
        y: layout.panelTop + layout.leftPanelY + 34 + index * JOURNAL_THEME.listRowStep,
        width: layout.leftPanelWidth - 32,
        height: 34
      }));

      if (currentPayload) {
        updateRows(currentPayload);
        updateDetail(currentPayload);
      }
    },
    handleWheel(pointerX, pointerY, deltaY) {
      if (!container.visible || !listBounds || !listScrollBounds) {
        return false;
      }

      const withinList =
        pointerX >= listBounds.x &&
        pointerX <= listBounds.x + listBounds.width &&
        pointerY >= listBounds.y &&
        pointerY <= listBounds.y + listBounds.height;
      const withinScrollbar =
        pointerX >= listScrollBounds.x &&
        pointerX <= listScrollBounds.x + listScrollBounds.width &&
        pointerY >= listScrollBounds.y &&
        pointerY <= listScrollBounds.y + listScrollBounds.height;

      if (!withinList && !withinScrollbar) {
        return false;
      }

      const entries = activeTab === 'enemies' ? currentPayload?.enemies ?? [] : currentPayload?.abilities ?? [];
      const maxOffset = Math.max(0, entries.length - JOURNAL_THEME.listVisibleRows);

      if (maxOffset === 0) {
        return false;
      }

      const direction = deltaY > 0 ? 1 : -1;
      scrollOffsets[activeTab] = Math.min(
        maxOffset,
        Math.max(0, (scrollOffsets[activeTab] ?? 0) + direction * JOURNAL_THEME.listScrollStep)
      );
      updateRows(currentPayload);
      return true;
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

      if (
        listScrollBounds &&
        pointerX >= listScrollBounds.x &&
        pointerX <= listScrollBounds.x + listScrollBounds.width &&
        pointerY >= listScrollBounds.y &&
        pointerY <= listScrollBounds.y + listScrollBounds.height
      ) {
        const entries = activeTab === 'enemies' ? currentPayload?.enemies ?? [] : currentPayload?.abilities ?? [];
        const maxOffset = Math.max(0, entries.length - JOURNAL_THEME.listVisibleRows);

        if (maxOffset > 0) {
          const ratio = Math.min(1, Math.max(0, (pointerY - listScrollBounds.y) / listScrollBounds.height));
          scrollOffsets[activeTab] = Math.round(ratio * maxOffset);
          updateRows(currentPayload);
        }
      }

      return null;
    },
    isVisible() {
      return container.visible;
    },
    getState() {
      return currentState;
    }
  };
}
