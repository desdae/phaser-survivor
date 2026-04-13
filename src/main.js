import Phaser from 'phaser';
import './styles.css';
import { HomeScene } from './game/scenes/HomeScene.js';
import { GameScene } from './game/scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#08121c',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [HomeScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
