import { getChoiceByIndex } from '../logic/upgradeSelection.js';

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

export function formatTime(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function createHud(scene) {
  const panel = scene.add.rectangle(0, 0, 340, 138, 0x08121c, 0.75).setOrigin(0);
  panel.setStrokeStyle(2, 0x4da2ff, 0.35);
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
  const container = scene.add.container(18, 18, [panel, hpText, levelText, xpText, timeText]);

  container.setDepth(40);
  container.setScrollFactor(0);

  return {
    layout() {
      container.setPosition(18, 18);
    },
    update({ health, maxHealth, level, xp, xpToNext, timeMs, enemyCount, projectileCount, bladeCount }) {
      hpText.setText(`HP ${Math.ceil(health)} / ${maxHealth}`);
      levelText.setText(`Level ${level}   Threats ${enemyCount}`);
      xpText.setText(`XP ${xp} / ${xpToNext}   Shots ${projectileCount}   Blades ${bladeCount}`);
      timeText.setText(`Time ${formatTime(timeMs)}`);
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
      const choice = getChoiceByIndex(cards.map((card) => card.choice).filter(Boolean), index);

      if (choice) {
        onSelect(choice);
      }
    },
    choosePointer(pointerX, pointerY) {
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

        card.background.setFillStyle(card.isUnlock ? 0x243a2b : 0x1f4561, 1);
        onSelect(card.choice);
        return true;
      }

      return false;
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
    .setStrokeStyle(2, 0xffb4a2, 0.8)
    .setInteractive({ useHandCursor: true });
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

  restartButton.on('pointerover', () => restartButton.setFillStyle(0xbf4f39, 1));
  restartButton.on('pointerout', () => restartButton.setFillStyle(0x9d402e, 1));
  restartButton.on('pointerdown', onRestart);

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
    }
  };
}
